import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import PayrollContent from "@/components/payroll/payroll-content";

export default function PayrollPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeMenu="payroll" onMenuChange={() => {}} />
      <main className="ml-64 min-h-screen">
        <TopBar activeMenu="payroll" />
        <div className="p-6">
          <PayrollContent />
        </div>
      </main>
    </div>
  );
}
