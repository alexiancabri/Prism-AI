import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";

/** Persistent shell for the authenticated product. AppLayout (the dark
 *  backdrop + nav rail) stays mounted across dashboard/sources/chat/settings,
 *  so switching pages only swaps the inner content — no white flash from the
 *  body showing through during a route's lazy-chunk load. */
export default function AppShell() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="h-full w-full bg-black" />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}
