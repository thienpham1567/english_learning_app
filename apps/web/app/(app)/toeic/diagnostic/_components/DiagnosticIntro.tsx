"use client";

import { Button, Card } from "antd";

export function DiagnosticIntro({ onStart }: { onStart: () => void }) {
  return (
    <Card title="Bài kiểm tra đầu vào TOEIC">
      <p>
        Bạn sẽ làm <strong>30 câu trong 20 phút</strong> để xác định điểm khởi đầu của từng kỹ năng
        nhỏ. Kết quả sẽ định hình lộ trình và gợi ý hằng ngày.
      </p>
      <ul>
        <li>Phủ tất cả Part 3–7 (Part 1 & 2 sẽ thêm vào diagnostic_v2 ở sub-project sau)</li>
        <li>Không xem giải thích cho đến khi nộp</li>
        <li>Kết quả ghi vào hồ sơ học tập của bạn (mastery khởi đầu)</li>
      </ul>
      <Button type="primary" size="large" onClick={onStart}>
        Bắt đầu
      </Button>
    </Card>
  );
}
