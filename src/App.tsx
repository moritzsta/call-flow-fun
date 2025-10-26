import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import OrganizationSettings from "./pages/OrganizationSettings";
import Projects from "./pages/Projects";
import ProjectDashboard from "./pages/ProjectDashboard";
import ProjectSettings from "./pages/ProjectSettings";
import ProjectCompanies from "./pages/ProjectCompanies";
import ProjectEmails from "./pages/ProjectEmails";
import Profile from "./pages/Profile";
import CompanyDetail from "./pages/CompanyDetail";
import EmailDetail from "./pages/EmailDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizations" 
              element={
                <ProtectedRoute>
                  <Organizations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizations/:id" 
              element={
                <ProtectedRoute>
                  <OrganizationSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id" 
              element={
                <ProtectedRoute>
                  <ProjectDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id/settings" 
              element={
                <ProtectedRoute>
                  <ProjectSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id/companies" 
              element={
                <ProtectedRoute>
                  <ProjectCompanies />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/companies/:companyId" 
              element={
                <ProtectedRoute>
                  <CompanyDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:id/emails" 
              element={
                <ProtectedRoute>
                  <ProjectEmails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/emails/:emailId" 
              element={
                <ProtectedRoute>
                  <EmailDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
