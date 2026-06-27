import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/app/ProtectedRoute";
import AppShell from "@/components/app/AppShell";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Marketing ROI page pulls in the (heavy) charting library — load on demand.
const Value = lazy(() => import("./pages/Value"));

// Product (authenticated) surface — code-split from the marketing site.
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
// Cinematic landing — now the main landing at "/".
const Cinematic = lazy(() => import("./pages/Cinematic"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Sources = lazy(() => import("./pages/Sources"));
const ChatApp = lazy(() => import("./pages/ChatApp"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <Routes>
              {/* Marketing */}
              <Route path="/" element={<Cinematic />} />
              <Route path="/cinematic" element={<Cinematic />} />
              <Route path="/classic" element={<Index />} />
              <Route path="/app" element={<Chat />} />
              <Route path="/roi" element={<Value />} />

              {/* Auth + onboarding */}
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Product (auth-gated) — one persistent shell keeps the dark
                  AppLayout mounted across these routes so navigating between
                  them doesn't flash the white body. */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="/chat" element={<ChatApp />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
