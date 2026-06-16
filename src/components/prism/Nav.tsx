import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { PrismLogo } from "./PrismLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Demo", href: "#demo" },
  { label: "ROI", href: "/roi", route: true },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // On the landing page hash links scroll in-place; elsewhere they route home first.
  const hrefFor = (l: { href: string; route?: boolean }) =>
    l.route ? l.href : pathname === "/" ? l.href : `/${l.href}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-3" : "py-5"
      )}
    >
      <div className="container">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            scrolled ? "glass-strong shadow-2xl" : "border border-transparent"
          )}
        >
          <Link to="/" className="shrink-0">
            <PrismLogo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) =>
              l.route ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={hrefFor(l)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => navigate("/app")}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/app")}
              className="group relative overflow-hidden rounded-lg bg-spectrum-gradient bg-[length:200%_auto] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[position:100%] hover:shadow-md"
            >
              Try Prism free
            </button>
          </div>

          <button
            className="rounded-lg p-2 text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="glass-strong mt-2 flex flex-col gap-1 rounded-2xl p-3 md:hidden animate-fade-in">
            {LINKS.map((l) =>
              l.route ? (
                <Link
                  key={l.href}
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={hrefFor(l)}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              )
            )}
            <button
              onClick={() => navigate("/app")}
              className="mt-1 rounded-lg bg-spectrum-gradient px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try Prism free
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
