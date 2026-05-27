import os
import re

VIETNAMESE_REGEX = re.compile(
    r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    r"ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]"
)

root_dir = "/Users/thienpham/Documents/english_learning_app/apps/web"

ignore_dirs = {".next", "node_modules", "out", "build", "dist", ".turbo"}

files_with_vi = []

for dirpath, dirnames, filenames in os.walk(root_dir):
    # Skip ignored directories
    dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
    for filename in filenames:
        if filename.endswith((".tsx", ".ts", ".css")):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    if VIETNAMESE_REGEX.search(content):
                        files_with_vi.append(filepath)
            except Exception as e:
                pass

print(f"Found {len(files_with_vi)} files containing Vietnamese:")
for f in sorted(files_with_vi):
    print(f)
