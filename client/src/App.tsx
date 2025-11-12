import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlanFeaturesProvider } from "@/contexts/PlanFeaturesContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import CompanyDashboard from "@/pages/CompanyDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCompanies from "@/pages/AdminCompanies";
import AdminValidations from "@/pages/AdminValidations";
import AdminStats from "@/pages/AdminStats";
import AdminSettings from "@/pages/AdminSettings";
import Events from "@/pages/Events";
import Participants from "@/pages/Participants";
import Vehicles from "@/pages/Vehicles";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import PlanFeatures from "@/pages/PlanFeatures";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import NotFound from "@/pages/not-found";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, company, plan } = useAuth();
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          userRole={(user?.role as "company" | "admin") || "company"}
          currentPlan={plan?.tier || "DECOUVERTE"}
          companyName={company?.name || ""}
          userName={user?.email || ""}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      
      {/* Company routes */}
      <Route path="/dashboard">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <CompanyDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/events">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Events />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/participants">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Participants />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Vehicles />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/stats">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Stats />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <Billing />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/plan-features">
        <ProtectedRoute requiredRole="company">
          <DashboardLayout>
            <PlanFeatures />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/companies">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminCompanies />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/validations">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminValidations />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/stats">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminStats />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout>
            <AdminSettings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PlanFeaturesProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
              <CookieBanner />
            </TooltipProvider>
          </PlanFeaturesProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
