import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { type ExtensionSettings, DEFAULT_SETTINGS } from "@/lib/messaging";
import styles from "@/styles/popup.module.css";

function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [query, setQuery] = useState("");
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }).then((s) => {
      if (s && !s.error) setSettings(s as ExtensionSettings);
    });
  }, []);

  // Check API connectivity
  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${settings.apiBaseUrl}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    }
    checkHealth();
  }, [settings.apiBaseUrl]);

  async function handleSaveSettings(newSettings: Partial<ExtensionSettings>) {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      settings: merged,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    // Open side panel with the word
    chrome.runtime.sendMessage({
      type: "OPEN_SIDE_PANEL",
      word: query.trim(),
    });
  }

  return (
    <div className={styles.popup}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>📖</span>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>English Companion</h1>
          <p className={styles.headerSubtitle}>Reading Assistant</p>
        </div>
        <div className={styles.status}>
          <span
            className={
              isOnline ? styles.statusDotOnline : styles.statusDotOffline
            }
          />
          <span>{isOnline === null ? "..." : isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>

      {/* Quick search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tra từ nhanh..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={80}
          autoFocus
        />
        <button type="submit" className={styles.searchBtn}>
          Tra cứu
        </button>
      </form>

      {/* Settings */}
      <div className={styles.settingsSection}>
        <p className={styles.settingsLabel}>Cài đặt</p>

        {/* API Base URL */}
        <div className={styles.settingRow}>
          <span className={styles.settingName}>API URL</span>
          <input
            type="text"
            className={styles.settingInput}
            value={settings.apiBaseUrl}
            onChange={(e) =>
              handleSaveSettings({ apiBaseUrl: e.target.value })
            }
          />
        </div>

        {/* Auto-save words toggle */}
        <div className={styles.settingRow}>
          <span className={styles.settingName}>Tự động lưu từ vựng</span>
          <button
            type="button"
            className={
              settings.autoSaveWords ? styles.toggleActive : styles.toggle
            }
            onClick={() =>
              handleSaveSettings({ autoSaveWords: !settings.autoSaveWords })
            }
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* Show tooltip on select */}
        <div className={styles.settingRow}>
          <span className={styles.settingName}>Hiện tooltip khi chọn text</span>
          <button
            type="button"
            className={
              settings.showTooltipOnSelect
                ? styles.toggleActive
                : styles.toggle
            }
            onClick={() =>
              handleSaveSettings({
                showTooltipOnSelect: !settings.showTooltipOnSelect,
              })
            }
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {saved && <span className={styles.savedNotice}>✓ Đã lưu</span>}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);
