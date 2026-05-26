"use client";

import { getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { Button, Card, Tag } from "antd";
import { useRouter } from "next/navigation";

export function DiagnosticResult({
  snapshot,
  score,
}: {
  snapshot: Record<string, number>;
  score: { correct: number; total: number } | null;
}) {
  const router = useRouter();
  const entries = Object.entries(snapshot).sort((a, b) => a[1] - b[1]);
  const weakest = entries.slice(0, 3);
  const strongest = entries.slice(-3).reverse();

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <Card title={`Kết quả: ${score?.correct ?? 0} / ${score?.total ?? 30}`}>
        <p>Lộ trình của bạn sẽ tập trung vào các kỹ năng yếu nhất.</p>
      </Card>
      <Card title="3 kỹ năng yếu nhất (ưu tiên ôn)" size="small">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {weakest.map(([skill, val]) => (
            <Tag key={skill} color="red">
              {getSkillLabel(skill as ToeicSkill)} · {val}/100
            </Tag>
          ))}
        </div>
      </Card>
      <Card title="3 kỹ năng mạnh nhất" size="small">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {strongest.map(([skill, val]) => (
            <Tag key={skill} color="green">
              {getSkillLabel(skill as ToeicSkill)} · {val}/100
            </Tag>
          ))}
        </div>
      </Card>
      <Button type="primary" size="large" onClick={() => router.push("/toeic")}>
        Bắt đầu lộ trình
      </Button>
    </div>
  );
}
