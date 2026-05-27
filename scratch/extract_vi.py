import os
import re
import json

VIETNAMESE_REGEX = re.compile(
    r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    r"ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]"
)

root_dir = "/Users/thienpham/Documents/english_learning_app/apps/web"
ignore_dirs = {".next", "node_modules", "out", "build", "dist", ".turbo"}

results = {}

for dirpath, dirnames, filenames in os.walk(root_dir):
    dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
    for filename in filenames:
        if filename.endswith((".tsx", ".ts", ".css")):
            filepath = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(filepath, "/Users/thienpham/Documents/english_learning_app")
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                matches = []
                for i, line in enumerate(lines):
                    if VIETNAMESE_REGEX.search(line):
                        matches.append({
                            "line": i + 1,
                            "content": line.strip()
                        })
                
                if matches:
                    results[rel_path] = matches
            except Exception:
                pass

with open("/Users/thienpham/Documents/english_learning_app/scratch/vietnamese_matches.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Extracted matches from {len(results)} files. Written to scratch/vietnamese_matches.json.")
