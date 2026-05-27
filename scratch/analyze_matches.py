import json
import collections

with open("/Users/thienpham/Documents/english_learning_app/scratch/vietnamese_matches.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Sort files by match count
sorted_files = sorted(data.items(), key=lambda x: len(x[1]), reverse=True)

print(f"Total files with Vietnamese: {len(sorted_files)}")
print("\nTop 30 files with most matches:")
for filepath, matches in sorted_files[:30]:
    print(f"- {filepath}: {len(matches)} matches")

# Group by directory prefix
dirs = collections.defaultdict(int)
for filepath, matches in sorted_files:
    parts = filepath.split('/')
    if len(parts) > 1:
        parent = '/'.join(parts[:4])
        dirs[parent] += len(matches)

print("\nMatches by directory/module:")
for d, count in sorted(dirs.items(), key=lambda x: x[1], reverse=True):
    print(f"- {d}: {count} matches")
