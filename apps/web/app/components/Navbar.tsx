"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Routes", href: "/routes" },
  { label: "Consumers", href: "/consumers" },
  { label: "Rate Limits", href: "/rate-limit" },
  { label: "IP Rules", href: "/ip-rule" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-md">
      <div className="flex items-center space-x-6">
        <Link href="/dashboard" className="flex items-center space-x-2 text-white font-semibold">
          <Globe className="h-5 w-5 text-blue-500" />
          <span>Conduit</span>
          <span className="text-sm text-zinc-400 font-normal">Gateway</span>
        </Link>

        <div className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-white/5 text-white border border-white/5 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
