/**
 * Hybrid Audio Cache — L1 (IndexedDB) + L2 (PostgreSQL)
 *
 * Flow:
 *   1. Check IndexedDB (instant, local)     → HIT → play
 *   2. Check DB via API (network round-trip) → HIT → play + save to IndexedDB
 *   3. Call Groq TTS (expensive)             → play + save to BOTH
 *
 * Saves Groq API calls for free-plan users.
 * IndexedDB persists across browser sessions.
 * DB persists across devices/browser clears.
 */

const DB_NAME = "read-aloud-audio-cache";
const DB_VERSION = 1;
const STORE_NAME = "audio";
const MAX_ENTRIES = 500;

interface CachedEntry {
  key: string;
  blob: Blob;
  mimeType: string;
  textPreview: string;
  voiceRole: string;
  speed: number;
  sizeBytes: number;
  createdAt: number;
  lastUsedAt: number;
}

// ─── IndexedDB Layer (L1) ───────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("lastUsedAt", "lastUsedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Build deterministic cache key */
export function makeCacheKey(text: string, voice: string, speed: number): string {
  return `${voice}|${speed}|${text.trim()}`;
}

/** L1 GET — check IndexedDB */
async function idbGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as CachedEntry | undefined;
        if (entry?.blob) {
          store.put({ ...entry, lastUsedAt: Date.now() });
          resolve(entry.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** L1 SET — save to IndexedDB */
async function idbSet(
  key: string,
  blob: Blob,
  meta: { text: string; voiceRole: string; speed: number },
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({
        key,
        blob,
        mimeType: blob.type || "audio/wav",
        textPreview: meta.text.slice(0, 100),
        voiceRole: meta.voiceRole,
        speed: meta.speed,
        sizeBytes: blob.size,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      } satisfies CachedEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    // Evict old entries
    const db2 = await openDB();
    const tx2 = db2.transaction(STORE_NAME, "readwrite");
    const store2 = tx2.objectStore(STORE_NAME);
    const countReq = store2.count();
    countReq.onsuccess = () => {
      if (countReq.result <= MAX_ENTRIES) return;
      const toDelete = countReq.result - MAX_ENTRIES;
      const idx = store2.index("lastUsedAt");
      const cursor = idx.openCursor();
      let deleted = 0;
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (c && deleted < toDelete) {
          c.delete();
          deleted++;
          c.continue();
        }
      };
    };
  } catch {
    // non-critical
  }
}

// ─── PostgreSQL Layer (L2) ──────────────────────────────────────

/** L2 GET — check DB via API */
async function dbGet(key: string): Promise<Blob | null> {
  try {
    const res = await fetch(`/api/tts-cache?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hit || !data.audioBase64) return null;

    // Decode base64 → Blob
    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: data.mimeType || "audio/wav" });
  } catch {
    return null;
  }
}

/** L2 SET — save to DB via API (fire-and-forget) */
function dbSet(
  key: string,
  blob: Blob,
  meta: { text: string; voiceRole: string; speed: number },
): void {
  // Convert blob to base64, then POST
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = (reader.result as string).split(",")[1] ?? "";
    fetch("/api/tts-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cacheKey: key,
        audioBase64: base64,
        mimeType: blob.type || "audio/wav",
        textPreview: meta.text.slice(0, 100),
        voiceRole: meta.voiceRole,
        speed: meta.speed,
        sizeBytes: blob.size,
      }),
    }).catch(() => {});
  };
  reader.readAsDataURL(blob);
}

// ─── Public Hybrid API ──────────────────────────────────────────

/**
 * Get cached audio — checks L1 (IndexedDB) then L2 (DB).
 * Returns { blob, source } or null.
 */
export async function getCachedAudio(
  key: string,
): Promise<{ blob: Blob; source: "idb" | "db" } | null> {
  // L1: IndexedDB (instant)
  const idbBlob = await idbGet(key);
  if (idbBlob) return { blob: idbBlob, source: "idb" };

  // L2: PostgreSQL (network)
  const dbBlob = await dbGet(key);
  if (dbBlob) {
    // Backfill L1 for next time
    idbSet(key, dbBlob, { text: "", voiceRole: "", speed: 1 }).catch(() => {});
    return { blob: dbBlob, source: "db" };
  }

  return null;
}

/**
 * Store audio in BOTH L1 and L2 caches.
 * L1 (IndexedDB) = synchronous-ish, L2 (DB) = fire-and-forget.
 */
export async function setCachedAudio(
  key: string,
  blob: Blob,
  meta: { text: string; voiceRole: string; speed: number },
): Promise<void> {
  // L1: save to IndexedDB
  await idbSet(key, blob, meta);

  // L2: save to DB (fire-and-forget, non-blocking)
  dbSet(key, blob, meta);
}

/** Clear ALL caches (L1 + L2) */
export async function clearAllCachedAudio(): Promise<void> {
  // L1: clear IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // non-critical
  }

  // L2: clear DB
  try {
    await fetch("/api/tts-cache", { method: "DELETE" });
  } catch {
    // non-critical
  }
}
