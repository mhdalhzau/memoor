import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { WebSocketProvider } from "@/lib/websocket-provider";
import { generateRoutes } from "@/utils/route-registry";
import GenericTemplatePage from "@/components/template/GenericTemplatePage";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import StaffPage from "@/pages/staff-page";
import PiutangPage from "@/pages/piutang-page";
import PayrollPage from "@/pages/payroll-page";
import EmployeeListPage from "@/pages/attendance/employee-list";
import AttendanceDetailPage from "@/pages/attendance/attendance-detail";
import DemoLayoutPage from "@/pages/demo-layout";
import NotFound from "@/pages/not-found";

const generatedRoutes = generateRoutes();

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/demo-layout" component={DemoLayoutPage} />
      <Route path="/staff" component={StaffPage} />
      <ProtectedRoute path="/piutang" component={PiutangPage} />
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/attendance" component={EmployeeListPage} />
      <ProtectedRoute path="/attendance/employee/:employeeId" component={AttendanceDetailPage} />
      
      {generatedRoutes.map((route) => {
        const existingRoutes = [
          "/",
          "/auth",
          "/demo-layout",
          "/staff",
          "/piutang",
          "/payroll",
          "/attendance",
        ];
        
        if (existingRoutes.includes(route.path)) {
          return null;
        }

        const PageComponent = () => (
          <GenericTemplatePage
            title={route.label}
            breadcrumbs={route.breadcrumbs}
          />
        );

        return (
          <ProtectedRoute
            key={route.path}
            path={route.path}
            component={PageComponent}
          />
        );
      })}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
