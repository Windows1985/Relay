"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, BoltIcon, TrophyIcon, BagIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon, match: (p: string) => p === "/" || p.startsWith("/g/") },
  { href: "/play", label: "Play", Icon: BoltIcon, match: (p: string) => p.startsWith("/play") || p.startsWith("/reveal") },
  { href: "/leaderboard", label: "Board", Icon: TrophyIcon, match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/shop", label: "Shop", Icon: BagIcon, match: (p: string) => p.startsWith("/shop") },
  { href: "/me", label: "Me", Icon: UserIcon, match: (p: string) => p.startsWith("/me") || p.startsWith("/admin") || p.startsWith("/install") },
];

const HIDDEN_ON = ["/join", "/pick-username", "/j/", "/auth/"];

export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="tabbar" aria-label="Main">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} className="tab" aria-current={active ? "page" : undefined}>
              <Icon size={24} className={active ? "text-g3" : undefined} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
