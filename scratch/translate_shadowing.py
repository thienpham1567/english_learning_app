file_path = "/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/read-aloud/_components/ShadowingMode.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace imports
code = code.replace(
    'import {\n  ChevronRight,\n  CircleCheckBig,\n  Loader2,\n  Mic,\n  PlayCircle,\n  Redo,\n  StopCircle,\n  Volume2,\n} from "lucide-react";',
    'import {\n  ChevronRight,\n  CircleCheckBig,\n  Loader2,\n  Mic,\n  PlayCircle,\n  Redo,\n  StopCircle,\n  Volume2,\n  BookOpen,\n  Award,\n  Sparkles,\n  Lightbulb,\n  Headphones\n} from "lucide-react";'
)

replacements = [
    ('message.error("Lỗi phát audio")', 'message.error("Audio playback error")'),
    ('message.error("Không thể phát câu mẫu")', 'message.error("Unable to play model sentence")'),
    ('message.error("Không có bản ghi âm")', 'message.error("No audio recording found")'),
    ('message.warning("Không nhận dạng được giọng nói. Hãy nói rõ hơn và thử lại.")', 'message.warning("Speech not recognized. Please speak clearly and try again.")'),
    ('message.error(err instanceof Error ? err.message : "Lỗi chấm điểm")', 'message.error(err instanceof Error ? err.message : "AI grading failed")'),
    
    # Empty state
    ('<div className="mb-4" style={{ fontSize: 48 }}>\n          🎙️\n        </div>', '<div className="flex justify-center mb-4"><Mic size={48} className="text-accent" /></div>'),
    ('Hãy nhập hoặc chọn một đoạn văn ở tab &quot;Nghe&quot; trước, sau đó quay lại đây để luyện\n          đọc theo.', 'Please enter or select a passage in the "Listen" tab first, then return here to practice shadowing.'),
    
    # Progress header
    ('📖 Câu {currentIdx + 1} / {sentences.length}', '<BookOpen size={14} className="text-accent inline-block mr-1" /> Sentence {currentIdx + 1} of {sentences.length}'),
    ('{progress}% hoàn thành', '{progress}% completed'),
    
    # Model sentence card
    ('🔊 Câu mẫu', 'Model Sentence'),
    ('<Volume2 /> Nghe câu mẫu', '<Volume2 /> Listen to Model'),
    ('Đang phát câu mẫu... Hãy lắng nghe kỹ', 'Playing model sentence... Listen carefully'),
    ('<PlayCircle /> Nghe lại', '<PlayCircle size={13} /> Listen Again'),
    ('<Mic /> 🎙️ Đọc theo', '<Mic size={14} /> Speak Now'),
    ('Đang ghi âm... Hãy đọc câu ở trên', 'Recording... Read the sentence above'),
    ('<StopCircle /> Dừng & chấm điểm', '<StopCircle size={13} /> Stop & Grade'),
    ('<div className="text-sm font-bold text-accent">🤖 AI đang chấm điểm phát âm...</div>', '<div className="text-sm font-bold text-accent flex items-center justify-center gap-1.5"><Loader2 className="animate-spin" size={14} /> AI is grading your pronunciation...</div>'),
    ('<Redo /> Thử lại', '<Redo size={13} /> Retry'),
    ('Câu tiếp theo <ChevronRight />', 'Next Sentence <ChevronRight />'),
    
    # Completed state
    ('<div className="mb-2" style={{ fontSize: 40 }}>\n            🎉\n          </div>', '<div className="flex justify-center mb-2"><Award size={40} className="text-accent" /></div>'),
    ('Hoàn thành!', 'Completed!'),
    ('Điểm trung bình:{" "}', 'Average Score:{" "}'),
    ('🔄 Luyện lại từ đầu', 'Practice Again')
]

for target, repl in replacements:
    if target in code:
        code = code.replace(target, repl)
        print(f"Replaced: {target} -> {repl}")
    else:
        print(f"NOT found: {target}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("ShadowingMode translation completed!")
