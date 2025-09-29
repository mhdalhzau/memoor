import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { WebSocketProvider } from "@/lib/websocket-provider";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import StaffPage from "@/pages/staff-page";
import PiutangPage from "@/pages/piutang-page";
import PayrollPage from "@/pages/payroll-page";
import EmployeeListPage from "@/pages/attendance/employee-list";
import AttendanceDetailPage from "@/pages/attendance/attendance-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/staff" component={StaffPage} />
      <ProtectedRoute path="/piutang" component={PiutangPage} />
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/attendance" component={EmployeeListPage} />
      <ProtectedRoute path="/attendance/employee/:employeeId" component={AttendanceDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
