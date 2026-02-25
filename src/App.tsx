import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Account from "./pages/Account";
import OurMission from "./pages/OurMission";
import HowToUse from "./pages/HowToUse";
import Bookshelf from "./pages/Bookshelf";
import Blogs from "./pages/Blogs";
import BlogEditor from "./pages/BlogEditor";
import { HabitsProvider } from "@/context/HabitsContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HabitsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/our-mission"
                element={
                  <ProtectedRoute>
                    <OurMission />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/how-to-use"
                element={
                  <ProtectedRoute>
                    <HowToUse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookshelf"
                element={
                  <ProtectedRoute>
                    <Bookshelf />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs"
                element={
                  <ProtectedRoute>
                    <Blogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blogs/:id"
                element={
                  <ProtectedRoute>
                    <BlogEditor />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </HabitsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
