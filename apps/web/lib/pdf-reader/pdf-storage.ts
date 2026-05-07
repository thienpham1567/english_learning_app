/**
 * IndexedDB storage layer for PDF books.
 * All data is client-side only — no server upload.
 */

const DB_NAME = "pdf-reader";
const DB_VERSION = 1;
const STORE_NAME = "books";

export interface PdfBook {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  lastPage: number;
  lastReadAt?: number;
  addedAt: number;
  data: ArrayBuffer;
}

export type PdfBookMeta = Omit<PdfBook, "data">;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txStore(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a PDF book to IndexedDB */
export async function saveBook(book: PdfBook): Promise<void> {
  const db = await openDB();
  const store = txStore(db, "readwrite");
  await reqToPromise(store.put(book));
  db.close();
}

/** Get a single book (with binary data) */
export async function getBook(id: string): Promise<PdfBook | undefined> {
  const db = await openDB();
  const store = txStore(db, "readonly");
  const result = await reqToPromise(store.get(id));
  db.close();
  return result as PdfBook | undefined;
}

/** Get all books (metadata only, no binary data for performance) */
export async function getAllBooks(): Promise<PdfBookMeta[]> {
  const db = await openDB();
  const store = txStore(db, "readonly");
  const all = await reqToPromise(store.getAll());
  db.close();
  // Strip binary data for listing performance
  return (all as PdfBook[]).map(({ data: _data, ...meta }) => meta);
}

/** Delete a book */
export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  const store = txStore(db, "readwrite");
  await reqToPromise(store.delete(id));
  db.close();
}

/** Update the last-read page bookmark */
export async function updateBookmark(
  id: string,
  lastPage: number,
): Promise<void> {
  const db = await openDB();
  const store = txStore(db, "readwrite");
  const book = (await reqToPromise(store.get(id))) as PdfBook | undefined;
  if (book) {
    book.lastPage = lastPage;
    book.lastReadAt = Date.now();
    await reqToPromise(store.put(book));
  }
  db.close();
}

/** Generate a unique book ID */
export function generateBookId(): string {
  return `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get the most recently read book (for Continue Reading hero) */
export async function getMostRecentBook(): Promise<PdfBookMeta | null> {
  const all = await getAllBooks();
  if (all.length === 0) return null;
  // Sort by lastReadAt (fallback to addedAt), return the most recent
  return all.sort(
    (a, b) => (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt),
  )[0];
}
