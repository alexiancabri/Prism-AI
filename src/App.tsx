import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/app/ProtectedRoute";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Marketing ROI page pulls in the (heavy) charting library — load on demand.
const Value = lazy(() => import("./pages/Value"));

// Product (authenticated) surface — code-split from the marketing site.
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
// Experimental cinematic landing (local-only spike).
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
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              {/* Marketing */}
              <Route path="/" element={<Index />} />
              <Route path="/app" element={<Chat />} />
              <Route path="/roi" element={<Value />} />

              {/* Experimental */}
              <Route path="/cinematic" element={<Cinematic />} />

              {/* Auth + onboarding */}
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Product (auth-gated) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sources"
                element={
                  <ProtectedRoute>
                    <Sources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

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
