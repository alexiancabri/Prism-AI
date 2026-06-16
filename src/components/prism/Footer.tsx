import { PrismLogo } from "./PrismLogo";

const COLUMNS = [
  {
    title: "Product",
    links: ["Overview", "Live demo", "Security", "Integrations", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Customers", "Press"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API reference", "Trust center", "Status", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 pt-16 pb-10">
      <div className="container">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <PrismLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Prism turns your entire document library into a single, queryable
              mind — with answers you can trace back to the source.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Prism Intelligence, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">SOC 2</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
