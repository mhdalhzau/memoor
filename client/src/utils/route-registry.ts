import { MenuItem, DreamPOSMenu } from "@/config/dreampos-menu";
import { LucideIcon } from "lucide-react";

export interface Breadcrumb {
  label: string;
  path?: string;
  icon?: LucideIcon;
}

export interface Route {
  path: string;
  label: string;
  icon?: LucideIcon;
  breadcrumbs: Breadcrumb[];
  component?: React.ComponentType;
}

interface RouteExtractionContext {
  breadcrumbTrail: Breadcrumb[];
}

function extractRoutesFromMenuItem(
  item: MenuItem,
  context: RouteExtractionContext,
  routes: Route[]
): void {
  const currentBreadcrumb: Breadcrumb = {
    label: item.label,
    path: item.link,
    icon: item.icon,
  };

  const newContext: RouteExtractionContext = {
    breadcrumbTrail: [...context.breadcrumbTrail, currentBreadcrumb],
  };

  if (item.link && item.link !== "#") {
    routes.push({
      path: item.link,
      label: item.label,
      icon: item.icon,
      breadcrumbs: newContext.breadcrumbTrail,
    });
  }

  if (item.submenuItems) {
    for (const subItem of item.submenuItems) {
      extractRoutesFromMenuItem(subItem, newContext, routes);
    }
  }
}

export function generateRoutes(): Route[] {
  const routes: Route[] = [];

  for (const section of DreamPOSMenu) {
    if (section.submenuItems) {
      for (const item of section.submenuItems) {
        extractRoutesFromMenuItem(
          item,
          { breadcrumbTrail: [] },
          routes
        );
      }
    }
  }

  return routes;
}

export function findRouteByPath(path: string): Route | null {
  const routes = generateRoutes();
  return routes.find((route) => route.path === path) || null;
}

export function getBreadcrumbs(path: string): Breadcrumb[] {
  const route = findRouteByPath(path);
  return route?.breadcrumbs || [];
}

export function getAllRoutePaths(): string[] {
  const routes = generateRoutes();
  return routes.map((route) => route.path);
}

export function getRouteCount(): number {
  return generateRoutes().length;
}
