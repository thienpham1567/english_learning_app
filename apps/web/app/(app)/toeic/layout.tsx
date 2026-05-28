import type { ReactNode } from "react";
import { SubNav } from "./_components/SubNav";

export default function ToeicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      <SubNav />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
