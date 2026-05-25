import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  manifest: {
    name: "English Reading Companion",
    description:
      "Look up words and translate sentences while reading English articles",
    icons: {
      "16": "icon/icon-16.png",
      "32": "icon/icon-32.png",
      "48": "icon/icon-48.png",
      "128": "icon/icon-128.png",
    },
    permissions: ["activeTab", "sidePanel", "storage", "contextMenus"],
    host_permissions: [
      "https://thienglish.vercel.app/*",
      "http://localhost:3000/*",
      "http://localhost:3002/*"
    ],
    side_panel: {
      default_path: "sidepanel.html",
    },
    commands: {
      "lookup-selection": {
        suggested_key: {
          default: "Ctrl+Shift+D",
          mac: "Command+Shift+D",
        },
        description: "Look up or translate selected text",
      },
    },
  },
});
