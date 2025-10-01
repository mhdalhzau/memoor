import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";

interface MainLayoutProps {
  children: React.ReactNode;
  showBreadcrumb?: boolean;
}

export default function MainLayout({ children, showBreadcrumb = true }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    return stored === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onMobileMenuToggle={toggleMobileMenu}
      />
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
      />
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
        data-testid="main-content"
      >
        <div className="container mx-auto p-4 lg:p-6">
          {showBreadcrumb && <Breadcrumb />}
          <div className="mt-4">{children}</div>
        </div>
      </main>
    </div>
  );
}
