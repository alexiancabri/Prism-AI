/* Brand logos for the source cards — real artwork, transparent (no tile). */
import { cn } from "@/lib/utils";

const BASE = "h-10 w-10 object-contain shrink-0";

function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={cn(BASE, className)} />;
}

export function GoogleDriveLogo({ className }: { className?: string }) {
  return <Logo src="/logos/googledrive.png" alt="Google Drive" className={className} />;
}
export function NotionLogo({ className }: { className?: string }) {
  return <Logo src="/logos/notion.png" alt="Notion" className={className} />;
}
export function SharePointLogo({ className }: { className?: string }) {
  return <Logo src="/logos/sharepoint.png" alt="SharePoint" className={className} />;
}
export function PdfLogo({ className }: { className?: string }) {
  return <Logo src="/logos/pdf.png" alt="PDF" className={className} />;
}
export function WordLogo({ className }: { className?: string }) {
  return <Logo src="/logos/word.png" alt="Word" className={className} />;
}
