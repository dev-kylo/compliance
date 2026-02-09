import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/researchers", label: "Researchers", icon: "👤" },
  { href: "/grants", label: "Grants", icon: "📋" },
  { href: "/timesheets", label: "Timesheets", icon: "📅" },
  { href: "/calculations", label: "Calculations", icon: "🧮" },
];

export function Nav() {
  return (
    <nav className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-bold text-primary">UKRI Compliance</h1>
        <p className="text-xs text-muted-foreground">Officer Portal</p>
      </div>
      <div className="flex-1 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Loughborough University</p>
        <p className="text-xs text-muted-foreground">MVP Pilot</p>
      </div>
    </nav>
  );
}
