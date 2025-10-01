import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoLayoutPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DreamPOS Layout Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates all the layout components working together.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Header Component</CardTitle>
              <CardDescription>Top navigation bar</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Logo with DreamPOS branding</li>
                <li>✅ Sidebar toggle button</li>
                <li>✅ Search bar with dropdown</li>
                <li>✅ Language selector</li>
                <li>✅ Theme toggle (light/dark)</li>
                <li>✅ Fullscreen toggle</li>
                <li>✅ Notifications dropdown</li>
                <li>✅ Messages dropdown</li>
                <li>✅ User profile dropdown</li>
                <li>✅ Mobile menu toggle</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sidebar Component</CardTitle>
              <CardDescription>Multi-level navigation menu</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Multi-level menu (3 levels deep)</li>
                <li>✅ Active route highlighting</li>
                <li>✅ Expand/collapse persistence</li>
                <li>✅ Section headers</li>
                <li>✅ Smooth animations</li>
                <li>✅ ScrollArea for long menus</li>
                <li>✅ Mini-sidebar mode (icons only)</li>
                <li>✅ Mobile responsive with overlay</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MainLayout Component</CardTitle>
              <CardDescription>Layout wrapper</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Header + Sidebar + Content</li>
                <li>✅ Responsive layout</li>
                <li>✅ Mobile sidebar slide-in</li>
                <li>✅ Proper padding and spacing</li>
                <li>✅ Dark mode support</li>
                <li>✅ Breadcrumb integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breadcrumb Component</CardTitle>
              <CardDescription>Navigation path</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Auto-generated from route</li>
                <li>✅ Uses DreamPOSMenu structure</li>
                <li>✅ Links to parent routes</li>
                <li>✅ Current page non-clickable</li>
                <li>✅ Icons for menu items</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Support</CardTitle>
              <CardDescription>Light and dark modes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Theme provider hook</li>
                <li>✅ localStorage persistence</li>
                <li>✅ Toggle in header</li>
                <li>✅ All components responsive to theme</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Test IDs</CardTitle>
              <CardDescription>Testing attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ All buttons have data-testid</li>
                <li>✅ All menu items have data-testid</li>
                <li>✅ All dropdown items have data-testid</li>
                <li>✅ Breadcrumb items have data-testid</li>
                <li>✅ Main content area has data-testid</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Desktop:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Click the toggle button next to logo to collapse/expand sidebar</li>
                <li>• Test all dropdown menus in the header</li>
                <li>• Click menu items in sidebar to test navigation and active states</li>
                <li>• Toggle dark mode and verify all components adapt</li>
                <li>• Click fullscreen button to test fullscreen mode</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mobile:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Click hamburger menu (three lines) to open mobile sidebar</li>
                <li>• Click overlay or menu item to close sidebar</li>
                <li>• Test all header dropdowns on small screens</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
