"use client";

import { PERSONAS, type Persona } from "@/lib/chat/personas";

type Props = {
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
  onSuggestedPrompt: (text: string) => void;
};

export function EmptyState({ selectedPersonaId, onSelectPersona, onSuggestedPrompt }: Props) {
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  return (
    <div
      className="anim-fade-in"
      style={{
        margin: "auto",
        display: "flex",
        maxWidth: 760,
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h2
        className="anim-fade-up anim-delay-1"
        style={{
          fontSize: 36,
          fontStyle: "italic",
          fontFamily: "var(--font-display)",
          color: "var(--ink)",
        }}
      >
        Chọn gia sư để bắt đầu
      </h2>
      <p
        className="anim-fade-up anim-delay-2"
        style={{
          marginTop: 8,
          maxWidth: 400,
          fontSize: 15,
          color: "var(--text-secondary)",
        }}
      >
        Mỗi gia sư có phong cách riêng — chọn người phù hợp nhất với bạn.
      </p>

      {/* Persona cards grid */}
      <div
        style={{
          marginTop: 24,
          display: "grid",
          width: "100%",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {PERSONAS.map((persona, i) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isSelected={persona.id === selectedPersonaId}
            animDelay={Math.min(i + 3, 8)}
            onSelect={() => onSelectPersona(persona.id)}
          />
        ))}
      </div>

      {/* Suggested prompts */}
      <div
        className="anim-fade-up anim-delay-5"
        style={{
          marginTop: 28,
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          Thử hỏi
        </span>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {activePersona.suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSuggestedPrompt(prompt)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                maxWidth: 300,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaCard({
  persona,
  isSelected,
  animDelay,
  onSelect,
}: {
  persona: Persona;
  isSelected: boolean;
  animDelay: number;
  onSelect: () => void;
}) {
  const Avatar = persona.avatar;

  return (
    <button
      className={`anim-fade-up anim-delay-${animDelay}`}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        borderRadius: "var(--radius-lg)",
        border: isSelected
          ? "2px solid var(--accent)"
          : "1px solid var(--border)",
        background: isSelected ? "var(--accent-light)" : "var(--surface)",
        padding: "20px 16px",
        textAlign: "center",
        boxShadow: isSelected
          ? "0 0 0 1px var(--accent)"
          : "var(--shadow-sm)",
        transition:
          "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s",
        cursor: "pointer",
      }}
    >
      <Avatar size={48} />
      <span
        style={{
          marginTop: 4,
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {persona.label}
      </span>
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 500,
          background: isSelected ? "var(--accent)" : "var(--bg-deep)",
          color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {persona.specialty}
      </span>
      <span
        style={{
          marginTop: 2,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--text-secondary)",
        }}
      >
        {persona.description}
      </span>
    </button>
  );
}
