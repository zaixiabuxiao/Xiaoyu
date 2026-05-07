import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-cream text-navy">
      <main className="mx-auto max-w-md px-4 pt-6 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
