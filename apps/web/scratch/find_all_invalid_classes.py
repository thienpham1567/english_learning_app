import os
import re

ROOT_DIR = "/Users/thienpham/Documents/english_learning_app/apps/web"
PATTERN = re.compile(r'\b([a-zA-Z0-9_-]+)-\(--([a-zA-Z0-9_-]+)\)')

pairs = {}

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
                for prefix, var_name in matches:
                    if prefix not in pairs:
                        pairs[prefix] = set()
                    pairs[prefix].add(var_name)
            except Exception as e:
                pass

print("Prefixes and their corresponding variable names:")
for prefix, vars_set in sorted(pairs.items()):
    print(f"  {prefix}: {sorted(list(vars_set))}")
