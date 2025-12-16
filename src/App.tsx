import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import '@/i18n/config';
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
import Settings from "./pages/Settings";
import CompanyDetail from "./pages/CompanyDetail";
import EmailDetail from "./pages/EmailDetail";
import EmailTemplates from "./pages/EmailTemplates";
import NotFound from "./pages/NotFound";
import WorkflowFinderFelix from "./pages/WorkflowFinderFelix";
import WorkflowAnalyseAnna from "./pages/WorkflowAnalyseAnna";
import WorkflowPitchPaul from "./pages/WorkflowPitchPaul";
import WorkflowBrandingBritta from "./pages/WorkflowBrandingBritta";
import AutomationStatus from "./pages/AutomationStatus";
import WorkflowStatus from "./pages/WorkflowStatus";
import WorkflowSendeSusan from "./pages/WorkflowSendeSusan";
import WorkflowUpdateUwe from "./pages/WorkflowUpdateUwe";
import ProjectWorkflows from "./pages/ProjectWorkflows";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Imprint from "./pages/Imprint";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/imprint" element={<Imprint />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
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
                path="/projects/:id/finder-felix" 
                element={
                  <ProtectedRoute>
                    <WorkflowFinderFelix />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/analyse-anna" 
                element={
                  <ProtectedRoute>
                    <WorkflowAnalyseAnna />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/pitch-paul" 
                element={
                  <ProtectedRoute>
                    <WorkflowPitchPaul />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/branding-britta" 
                element={
                  <ProtectedRoute>
                    <WorkflowBrandingBritta />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/automation-status" 
                element={
                  <ProtectedRoute>
                    <AutomationStatus />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/workflow-status/:workflowId" 
                element={
                  <ProtectedRoute>
                    <WorkflowStatus />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/workflows" 
                element={
                  <ProtectedRoute>
                    <ProjectWorkflows />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/sende-susan/:workflowId" 
                element={
                  <ProtectedRoute>
                    <WorkflowSendeSusan />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id/update-uwe/:workflowId" 
                element={
                  <ProtectedRoute>
                    <WorkflowUpdateUwe />
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
                path="/organizations/:organizationId/templates" 
                element={
                  <ProtectedRoute>
                    <EmailTemplates />
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
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
