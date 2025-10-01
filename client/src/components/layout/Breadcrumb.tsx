import { useLocation, Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { DreamPOSMenu, MenuItem } from "@/config/dreampos-menu";
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Breadcrumb() {
  const [location] = useLocation();

  const findMenuPath = (
    items: MenuItem[],
    path: string,
    currentPath: MenuItem[] = []
  ): MenuItem[] | null => {
    for (const item of items) {
      const newPath = [...currentPath, item];

      if (item.link === path) {
        return newPath;
      }

      if (item.submenuItems) {
        const found = findMenuPath(item.submenuItems, path, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  const getBreadcrumbPath = () => {
    // Flatten all menu items
    const allItems: MenuItem[] = [];
    DreamPOSMenu.forEach((section) => {
      if (section.submenuItems) {
        allItems.push(...section.submenuItems);
      }
    });

    const path = findMenuPath(allItems, location);
    return path || [];
  };

  const breadcrumbPath = getBreadcrumbPath();

  // Don't show breadcrumb on home page
  if (location === "/" || breadcrumbPath.length === 0) {
    return null;
  }

  return (
    <BreadcrumbUI data-testid="breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" data-testid="breadcrumb-home">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbPath.map((item, index) => {
          const isLast = index === breadcrumbPath.length - 1;
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-center gap-2">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage
                    className="flex items-center gap-2"
                    data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.link || "#"}
                      className="flex items-center gap-2"
                      data-testid={`breadcrumb-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}
