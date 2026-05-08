import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import PasscodeGate from "./PasscodeGate";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <PasscodeGate>
      <div className="min-h-screen bg-cream text-navy">
        <main className="mx-auto max-w-md px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </PasscodeGate>
  );
}
