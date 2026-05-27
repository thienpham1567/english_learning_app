file_path = "/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/read-aloud/_components/DialoguePlayer.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

replacements = [
    ("Stop nghe", "Stop Listening"),
    ("Stop & chấm điểm", "Stop & Grade"),
    ("Lượt bạn! Hãy đọc lines của mình", "Your turn! Read your line"),
    ("Đang phát lines ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} / ${dlg.dialogue.lines.length}", "Playing line ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} of ${dlg.dialogue.lines.length}")
]

for target, repl in replacements:
    if target in code:
        code = code.replace(target, repl)
        print(f"Replaced: {target} -> {repl}")
    else:
        print(f"NOT found: {target}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("DialoguePlayer translation fix completed!")
