import os
import re

ROOT_DIR = "/Users/thienpham/Documents/english_learning_app/apps/web"

# Regex for normal prefixes: prefix-(--var)
NORMAL_PREFIX_RE = re.compile(
    r'\b(bg|text|border|border-l|fill|from|to|placeholder|ring|scrollbar-thumb)-\(--([a-zA-Z0-9_-]+)\)'
)

# Regex for border radius: rounded-(--radius-...)
RADIUS_RE = re.compile(r'\b(rounded)-\(--radius-(2xl|lg|xl)\)')

# Regex for shadows: shadow-(--shadow-...)
SHADOW_SM_RE = re.compile(r'\bshadow-\(--shadow-(sm|md|lg|xl)\)')
SHADOW_RE = re.compile(r'\bshadow-\(--shadow\)')

# Regex for radix dynamic variables: prefix-(--radix-...)
RADIX_RE = re.compile(r'\b(h|max-h|min-w|origin|w)-\(--(radix-[a-zA-Z0-9_-]+)\)')

replacements_log = []

for dirpath, _, filenames in os.walk(ROOT_DIR):
    if "node_modules" in dirpath or ".next" in dirpath:
        continue
    for filename in filenames:
        if filename.endswith(".tsx") or filename.endswith(".ts") or filename.endswith(".css"):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                orig = content
                new_content = orig

                # 1. Radix variables: h-(--radix-...) -> h-[var(--radix-...)]
                new_content = RADIX_RE.sub(r'\1-[var(--\2)]', new_content)

                # 2. Radius variables: rounded-(--radius-lg) -> rounded-lg
                new_content = RADIUS_RE.sub(r'\1-\2', new_content)

                # 3. Shadows
                new_content = SHADOW_SM_RE.sub(r'shadow-\1', new_content)
                new_content = SHADOW_RE.sub(r'shadow', new_content)

                # 4. Normal prefixes: bg-(--var) -> bg-var
                new_content = NORMAL_PREFIX_RE.sub(r'\1-\2', new_content)

                if orig != new_content:
                    replacements_log.append({
                        "file": filepath,
                        "changes_count": len(re.findall(r'\b(bg|text|border|shadow|rounded|h|w|max-h|min-w|origin)-\(--', orig))
                    })
            except Exception as e:
                pass

print(f"Total files that will be modified: {len(replacements_log)}")
for r in replacements_log[:30]:
    print(f"  {r['file']} (Estimated changes: {r['changes_count']})")
