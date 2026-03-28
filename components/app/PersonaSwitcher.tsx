"use client";

import { Select } from "antd";

import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  value: string;
  onChange: (personaId: string) => void;
  disabled?: boolean;
};

export function PersonaSwitcher({ value, onChange, disabled }: Props) {
  return (
    <Select
      value={value}
      onChange={onChange}
      disabled={disabled}
      size="small"
      variant="borderless"
      className="shrink-0"
      style={{ minWidth: 190 }}
      options={PERSONAS.map((p) => ({ value: p.id, label: p.label }))}
    />
  );
}
