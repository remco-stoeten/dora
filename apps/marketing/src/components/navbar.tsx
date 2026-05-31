import Link from "next/link";

import { DoraMark } from "@/components/dora-mark";
import { NavbarThemeToggle } from "@/components/navbar-theme-toggle";
import { siteConfig } from "@/core/config/site";

const APP_PATH = "/app";

export function Navbar() {
  return (
    <nav
      className="fixed top-0 z-50 w-full backdrop-blur-md px-6"
      style={{
        background: "hsl(240 12% 4% / 0.78)",
        borderBottom: "1px solid hsl(var(--neon-cyan) / 0.18)",
      }}
    >
      <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 -ml-0.5 group">
          <DoraMark size={22} />
          <span
            className="text-[14px] font-bold tracking-[0.18em] uppercase transition-opacity group-hover:opacity-80"
            style={{
              color: "hsl(var(--neon-cyan))",
              textShadow: "0 0 12px hsl(var(--neon-cyan) / 0.5)",
            }}
          >
            {siteConfig.name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:inline">
            · {siteConfig.tagline.toLowerCase()}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/downloads"
            className="text-[13px] text-foreground/70 hover:text-foreground transition-colors h-8 px-3 inline-flex items-center"
          >
            Download
          </Link>
          <NavbarThemeToggle />
          <Link
            href={APP_PATH}
            className="group relative text-[13px] h-8 px-4 font-medium transition-all hover:brightness-110 inline-flex items-center"
            style={{
              background: "hsl(var(--neon-cyan))",
              color: "hsl(240 12% 6%)",
              boxShadow:
                "0 0 0 1px hsl(var(--neon-cyan) / 0.4), 0 0 18px hsl(var(--neon-cyan) / 0.45)",
            }}
          >
            View app
          </Link>
        </div>
      </div>
    </nav>
  );
}
