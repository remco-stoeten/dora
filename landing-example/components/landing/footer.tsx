export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="px-6 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[#e0e0e0] tracking-wide">Dora</span>
        <span className="text-[11px] text-[#4a4a4a]">
          Engineered for developers. Built for production.
        </span>
        <span className="text-[11px] text-[#3a3a3a]">&copy; {year} Dora. All rights reserved.</span>
      </div>

      <nav className="flex items-center gap-6" aria-label="Footer navigation">
        {(["Docs", "GitHub", "Changelog", "Contact"] as const).map((label) => (
          <a
            key={label}
            href="#"
            className="text-[12px] text-[#4a4a4a] hover:text-[#cfcfcf] transition-colors duration-150"
          >
            {label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
