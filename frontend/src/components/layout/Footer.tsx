export function Footer() {
  return (
    <footer className="w-full border-t border-paper-hairline bg-surface-container-low px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center text-label-sm font-label-sm text-on-surface-variant gap-4 mt-auto">
      <div className="flex flex-wrap items-center space-x-2 text-slate">
        <span className="tracking-widest uppercase">ATELIER LEDGER SYSTEM · KAKEBO METHOD · DEMO SIN FINES DE LUCRO</span>
        <span className="hidden sm:inline text-paper-hairline">|</span>
        <span className="hidden sm:inline font-ledger-num text-[10px]">USO ESTRICTAMENTE DEMOSTRATIVO</span>
      </div>

      <div className="flex items-center space-x-6">
        <a href="#principios" className="text-slate hover:text-primary transition-colors">
          Principios
        </a>
        <a href="#metodologia" className="text-slate hover:text-primary transition-colors">
          Sobres Kakebo
        </a>
        <a href="#manifiesto" className="text-slate hover:text-primary transition-colors">
          Manifiesto
        </a>
        <span className="text-slate/60">© 2026 Atelier</span>
      </div>
    </footer>
  )
}
