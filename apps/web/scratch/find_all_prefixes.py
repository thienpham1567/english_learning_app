import os
import re

ROOT_DIR = "/Users/thienpham/Documents/english_learning_app/apps/web"
PATTERN = re.compile(r'\b([a-zA-Z0-9_-]+)-\(--([a-zA-Z0-9_-]+)\)')

prefixes = set()

for dirpath, _, filenames in os.walk(ROOT_DIR):
    if "node_modules" in dirpath or ".next" in dirpath:
        continue
    for filename in filenames:
        if filename.endswith(".tsx") or filename.endswith(".ts") or filename.endswith(".css"):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                matches = PATTERN.findall(content)
                for prefix, _ in matches:
                    prefixes.add(prefix)
            except Exception as e:
                pass

print("All prefixes found:", sorted(list(prefixes)))
