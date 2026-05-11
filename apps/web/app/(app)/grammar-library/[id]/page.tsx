"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import * as m from "motion/react-client";
import { 
  ArrowLeftOutlined, 
  GlobalOutlined, 
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CopyOutlined
} from "@ant-design/icons";
import { Button, Tag, Divider, message } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import grammarData from "@/lib/grammar-lessons/butte-data.json";

// ── Main Component ───────────────────────────────────────────────
export default function GrammarDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const item = useMemo(() => {
    return grammarData.find(d => d.id === id);
  }, [id]);

  if (!item) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <h2>Chủ đề không tồn tại</h2>
        <Button onClick={() => router.push("/grammar-library")}>Quay lại thư viện</Button>
      </div>
    );
  }

  const copySource = () => {
    navigator.clipboard.writeText(item.source);
    message.success("Đã sao chép liên kết nguồn!");
  };

  return (
    <div style={{ minHeight: "100%", paddingBottom: 100 }}>
      <ModuleHeader
        icon={<BookOutlined />}
        gradient="linear-gradient(135deg, #C84B31 0%, #4A7C6F 100%)"
        title={item.title}
        subtitle="Chi tiết bài học ngữ pháp chuyên sâu"
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: -40, position: "relative", zIndex: 10 }}
        >
          <div style={{ 
            background: "var(--surface)", 
            borderRadius: 24, 
            padding: "40px", 
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)"
          }}>
            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                Quay lại
              </Button>
              <div style={{ display: "flex", gap: 10 }}>
                <Tag icon={<GlobalOutlined />} color="default" style={{ padding: "4px 10px", borderRadius: 6, margin: 0 }}>
                  English Reference
                </Tag>
              </div>
            </div>

            {/* Content Renderer */}
            <div className="grammar-content" style={{ 
              fontSize: 16, 
              lineHeight: 1.8, 
              color: "var(--ink)",
              fontFamily: "var(--font-body)"
            }}>
              {item.content.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} style={{ height: 16 }} />;
                
                // Header-like lines (all caps)
                if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes('HTTP')) {
                  return <h2 key={idx} style={{ fontSize: 24, fontWeight: 800, marginTop: 40, marginBottom: 20, color: "var(--accent)" }}>{trimmed}</h2>;
                }

                // List items
                if (trimmed.startsWith('- ')) {
                  return (
                    <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 8, paddingLeft: 8 }}>
                      <CheckCircleOutlined style={{ color: "var(--success)", marginTop: 6 }} />
                      <span>{trimmed.substring(2)}</span>
                    </div>
                  );
                }

                // Examples (lines with quotes or italic-like patterns)
                if (trimmed.includes('"') || trimmed.includes("'")) {
                  return (
                    <div key={idx} style={{ 
                      background: "var(--bg-deep)", 
                      padding: "16px 20px", 
                      borderRadius: 12, 
                      borderLeft: "4px solid var(--secondary)",
                      margin: "16px 0",
                      fontStyle: "italic",
                      color: "var(--text-secondary)"
                    }}>
                      {trimmed}
                    </div>
                  );
                }

                return <p key={idx} style={{ marginBottom: 16 }}>{trimmed}</p>;
              })}
            </div>

            <Divider />

            {/* Footer / Source */}
            <div style={{ 
              marginTop: 40, 
              padding: "24px", 
              borderRadius: 16, 
              background: "var(--bg-deep)",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                <BulbOutlined /> Nguồn tài liệu
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", wordBreak: "break-all" }}>
                  {item.source}
                </div>
                <Button 
                  size="small" 
                  icon={<CopyOutlined />} 
                  onClick={copySource}
                  style={{ flexShrink: 0 }}
                >
                  Sao chép
                </Button>
              </div>
            </div>
          </div>
        </m.div>
      </div>

      <style jsx global>{`
        .grammar-content h2 {
          font-family: var(--font-display);
          font-style: italic;
        }
        .grammar-content p strong {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 5%, transparent);
          padding: 0 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
