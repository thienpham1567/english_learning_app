import json
import sys

with open("/Users/thienpham/Documents/english_learning_app/scratch/vietnamese_matches.json", "r", encoding="utf-8") as f:
    data = json.load(f)

filename = sys.argv[1] if len(sys.argv) > 1 else "apps/web/app/sign-in/page.tsx"

if filename in data:
    print(f"=== Matches in {filename} ===")
    for m in data[filename]:
        print(f"Line {m['line']}: {m['content']}")
else:
    print(f"File {filename} not found or has no matches.")
