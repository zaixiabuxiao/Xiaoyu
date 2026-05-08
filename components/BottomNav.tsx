"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", label: "首页", glyph: "◆" },
  { href: "/chapters", label: "章节", glyph: "❖" },
  { href: "/memories", label: "回忆", glyph: "✦" },
  { href: "/us", label: "我们", glyph: "♥" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-cream border-t-3 border-navy pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <ul className="mx-auto max-w-md grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center py-3 min-h-[56px] font-pixel text-[10px] ${
                  active ? "text-warm-orange" : "text-navy"
                }`}
              >
                <span className="text-base leading-none mb-1">{item.glyph}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
