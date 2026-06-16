import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { PrismMark } from "@/components/prism/PrismLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-spectrum-1/[0.06] blur-[120px]" />
        <div className="absolute inset-0 bg-grid" />
      </div>
      <div className="relative z-10 text-center animate-fade-in">
        <PrismMark className="mx-auto h-14 w-14 animate-float" />
        <h1 className="mt-6 font-display text-7xl font-semibold text-spectrum">404</h1>
        <p className="mt-3 text-xl text-foreground">This page never refracted into view.</p>
        <p className="mt-1 text-muted-foreground">
          The link may be broken or the page may have moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-spectrum-gradient bg-[length:200%_auto] px-6 py-3 font-semibold text-white transition-all hover:bg-[position:100%]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prism
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
