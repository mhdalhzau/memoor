import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DreamPOSMenu, MenuItem } from "@/config/dreampos-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const stored = localStorage.getItem("expandedMenus");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("expandedMenus", JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (link?: string) => {
    if (!link) return false;
    return location === link;
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.link && isActive(item.link)) return true;
    if (item.submenuItems) {
      return item.submenuItems.some((subitem) => isParentActive(subitem));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasSubmenu = item.submenu && item.submenuItems && item.submenuItems.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const active = isParentActive(item);
    const Icon = item.icon;

    if (hasSubmenu) {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground",
              collapsed && level === 0 && "justify-center px-2"
            )}
            data-testid={`menu-toggle-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {Icon && (
              <Icon className={cn("h-5 w-5 shrink-0", collapsed && level === 0 && "h-6 w-6")} />
            )}
            {(!collapsed || level > 0) && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </>
            )}
          </button>
          {isExpanded && (!collapsed || level > 0) && (
            <div className={cn("space-y-1", level === 0 ? "pl-3" : "pl-6")}>
              {item.submenuItems?.map((subitem) => renderMenuItem(subitem, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.link || "#"}
        onClick={() => {
          if (mobileOpen) onClose();
        }}
      >
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive(item.link) && "bg-primary text-primary-foreground",
            collapsed && level === 0 && "justify-center px-2"
          )}
          data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {Icon && (
            <Icon className={cn("h-5 w-5 shrink-0", collapsed && level === 0 && "h-6 w-6")} />
          )}
          {(!collapsed || level > 0) && <span>{item.label}</span>}
        </div>
      </Link>
    );
  };

  const renderMenuSection = (section: MenuItem) => {
    return (
      <div key={section.label} className="space-y-2">
        {!collapsed && section.submenuHdr && (
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.submenuHdr}
          </h3>
        )}
        {collapsed && <Separator className="my-2" />}
        <div className="space-y-1">
          {section.submenuItems?.map((item) => renderMenuItem(item))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 border-r bg-card transition-all duration-300",
          "lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <ScrollArea className="h-full py-4">
          <div className="space-y-6 px-2">
            {DreamPOSMenu.map((section) => renderMenuSection(section))}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
