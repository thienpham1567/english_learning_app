import re

file_path = "/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/read-aloud/_components/DialoguePlayer.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Apply replacements
replacements = [
    # Alerts
    ('message.error("Không có bản ghi âm")', 'message.error("No audio recording found")'),
    ('message.warning("Không nhận dạng được. Hãy thử lại.")', 'message.warning("Speech not recognized. Please try again.")'),
    ('message.error("Lỗi chấm điểm")', 'message.error("AI grading failed")'),
    ('message.success("🎉 Hoàn thành hội thoại!")', 'message.success("Dialogue practice completed successfully!")'),
    
    # Setup form
    ('💬 Tạo hội thoại mới', '<MessageSquare size={16} className="text-accent" /> Create New Conversation'),
    ('Chủ đề (tùy chọn)', 'Topic (optional)'),
    ('Ví dụ: ordering coffee, job interview...', 'e.g., ordering coffee, job interview...'),
    ('Số người', 'Speakers'),
    ('n === 2 ? "👫 2 người" : "👨\u200d👩\u200d👦 3 người"', 'n === 2 ? "2 Speakers" : "3 Speakers"'),
    ('Độ dài', 'Length'),
    ('Ngắn (~5 câu)', 'Short (~5 lines)'),
    ('TB (~10 câu)', 'Medium (~10 lines)'),
    ('Dài (~16 câu)', 'Long (~16 lines)'),
    ('Đang tạo hội thoại...', 'Generating conversation...'),
    ('✨ Tạo hội thoại', '<Sparkles size={16} /> Generate Conversation'),
    ('📚 Hội thoại đã tạo', '<Bookmark size={13} className="text-accent" /> Saved Conversations'),
    ('câu', 'lines'),
    ('📌 {saved.topic}', '<Pin size={10} /> {saved.topic}'),
    ('🗑️', '<Trash2 size={13} />'),
    ('toLocaleDateString("vi-VN"', 'toLocaleDateString("en-US"'),
    
    # View header
    ('💬 {dlg.dialogue.title}', '<MessageSquare size={16} className="text-accent" /> {dlg.dialogue.title}'),
    ('Đang tải...', 'Loading...'),
    ('Dừng', 'Stop'),
    ('Phát tất cả', 'Play All'),
    ('Tạo mới', 'Reset'),
    
    # Step 1 preview
    ('<div className="text-[36px] mb-2.5">🎧</div>', '<div className="flex justify-center mb-2.5"><m.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: "inline-flex", color: "var(--accent)" }}><Headphones size={36} /></m.div></div>'),
    ('Nghe trước hội thoại', 'Listen to the Dialogue First'),
    ('Lắng nghe cuộc trò chuyện giữa những người bản xứ trước khi bạn đóng vai nhé!', 'Listen to the conversation between native speakers before you start roleplaying!'),
    ('Dừng nghe', 'Stop Listening'),
    ('Nghe hội thoại', 'Listen to Dialogue'),
    ('Bỏ qua →', 'Skip →'),
    ('Đang tải audio ${dlg.batchProgress.loaded}/${dlg.batchProgress.total}...', 'Loading audio ${dlg.batchProgress.loaded}/${dlg.batchProgress.total}...'),
    ('Đang tải audio ${dlg.dialogue.lines.length} lines...', 'Loading audio ${dlg.dialogue.lines.length} lines...'),
    ('Đang phát câu ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} / ${dlg.dialogue.lines.length}', 'Playing line ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} of ${dlg.dialogue.lines.length}'),
    
    # Step 2 roleplay select
    ('🎙️ Đóng vai — Chọn nhân vật bạn muốn đọc', '<Mic size={14} className="text-accent" /> Roleplay — Select the character you want to practice'),
    ('Nghe lại', 'Replay'),
    ('Đóng vai {line?.name ?? a.voiceName}', 'Roleplay as {line?.name ?? a.voiceName}'),
    
    # Active roleplay
    ('🎙️ Đang đóng vai — Bạn là', '<Mic size={14} /> Roleplay Active — You are'),
    ('Thoát', 'Exit'),
    ('▶ Bắt đầu hội thoại', 'Start Dialogue'),
    ('Đang nghe đối phương nói...', 'Listening to speaker...'),
    ('Lượt bạn! Hãy đọc câu của mình', 'Your turn! Read your line'),
    ('Dừng & chấm điểm', 'Stop & Grade'),
    ('🤖 Đang chấm điểm...', '🤖 AI Grading...'),
    ('"➡️ Tiếp tục"', '"Continue"'),
    ('"🎉 Hoàn thành"', '"Finish"')
]

for target, repl in replacements:
    if target in code:
        code = code.replace(target, repl)
        print(f"Replaced: {target} -> {repl}")
    else:
        # Check case-insensitive or minor spacing differences
        print(f"NOT found: {target}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Translation execution finished!")
