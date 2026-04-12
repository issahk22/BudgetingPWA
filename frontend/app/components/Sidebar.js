"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/insights", label: "Insights" },
    { href: "/history", label: "History" },
    { href: "/whatif", label: "What If" },
  ];

  return (
    <aside className="flex flex-col h-screen w-56 bg-gray-950 border-r border-border fixed top-0 left-0">
      <div className="px-5 py-6 text-lg font-bold text-accent tracking-wide">
        Fulus
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "flex items-center px-3 py-2.5 rounded-lg bg-gray-800 text-accent font-medium text-sm"
                  : "flex items-center px-3 py-2.5 rounded-lg text-muted hover:text-text hover:bg-gray-800/50 text-sm transition-colors"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
