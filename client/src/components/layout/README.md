# DreamPOS Layout Components

This directory contains the complete layout system for the DreamPOS application, built with Tailwind CSS and shadcn UI components.

## Components

### 1. Header.tsx
Top navigation bar with all essential features:
- **Logo**: DreamPOS branding with toggle button for sidebar
- **Search**: Searchable input with recent searches dropdown
- **Actions**:
  - Language selector (English/Indonesia)
  - Theme toggle (Light/Dark mode)
  - Fullscreen toggle
  - Notifications dropdown with badge
  - Messages dropdown with badge
  - User profile dropdown with logout
- **Mobile**: Hamburger menu for mobile sidebar toggle
- **Data Test IDs**: All interactive elements have test IDs

### 2. Sidebar.tsx
Multi-level navigation menu:
- **Menu Structure**: Uses DreamPOSMenu from config
- **Levels**: Supports 3-level deep menu hierarchy
- **Active State**: Highlights current route using Wouter's useLocation
- **Persistence**: Saves expand/collapse state to localStorage
- **Modes**:
  - Full mode: Shows icons and labels with section headers
  - Mini mode: Icons only (collapsed state)
- **Mobile**: Slide-in overlay for mobile devices
- **Scrolling**: Uses shadcn ScrollArea for long menus
- **Animations**: Smooth transitions for expand/collapse
- **Data Test IDs**: All menu items have test IDs

### 3. MainLayout.tsx
Main layout wrapper component:
- **Structure**: Combines Header + Sidebar + Content area
- **Responsive**: 
  - Desktop: Side-by-side layout with collapsible sidebar
  - Mobile: Stacked layout with overlay sidebar
- **Breadcrumbs**: Optional breadcrumb navigation
- **Persistence**: Sidebar state saved to localStorage
- **Dark Mode**: Full theme support via ThemeProvider
- **Data Test IDs**: Main content area has test ID

### 4. Breadcrumb.tsx
Auto-generated navigation path:
- **Auto-generation**: Builds path from current route
- **Menu Integration**: Uses DreamPOSMenu structure
- **Navigation**: Links to parent routes
- **Current Page**: Non-clickable current page indicator
- **Icons**: Shows menu item icons in breadcrumb
- **Data Test IDs**: All breadcrumb items have test IDs

## Theme Support

### ThemeProvider Hook (`hooks/use-theme.tsx`)
- Light/Dark mode switching
- localStorage persistence
- Document class management
- Context-based state management

## Usage

### Basic Layout
```tsx
import MainLayout from "@/components/layout/MainLayout";

export default function MyPage() {
  return (
    <MainLayout>
      {/* Your page content */}
    </MainLayout>
  );
}
```

### Without Breadcrumb
```tsx
<MainLayout showBreadcrumb={false}>
  {/* Your page content */}
</MainLayout>
```

## State Management

### Sidebar Collapse State
- Stored in: `localStorage.sidebarCollapsed`
- Type: `"true" | "false"`
- Controls: Desktop sidebar width (64px collapsed, 256px expanded)

### Menu Expansion State
- Stored in: `localStorage.expandedMenus`
- Type: `string[]` (array of menu labels)
- Controls: Which menu items are expanded

### Theme State
- Stored in: `localStorage.theme`
- Type: `"light" | "dark"`
- Controls: Application theme

## Responsive Breakpoints

- **Mobile**: < 768px
  - Sidebar hidden by default
  - Hamburger menu to toggle
  - Overlay when open
  
- **Tablet**: 768px - 1024px
  - Sidebar visible
  - Can be collapsed to mini mode

- **Desktop**: > 1024px
  - Full sidebar with all features
  - Collapsible to mini mode
  - Fullscreen toggle available

## Data Test IDs

All interactive elements include `data-testid` attributes for testing:

### Header
- `button-mobile-menu`: Mobile menu toggle
- `button-toggle-sidebar`: Desktop sidebar toggle
- `input-search`: Search input
- `button-language`: Language dropdown
- `button-theme-toggle`: Theme toggle
- `button-fullscreen`: Fullscreen toggle
- `button-notifications`: Notifications dropdown
- `button-messages`: Messages dropdown
- `button-user-profile`: User profile dropdown

### Sidebar
- `sidebar`: Main sidebar element
- `sidebar-overlay`: Mobile overlay
- `menu-toggle-{item}`: Menu expand/collapse buttons
- `menu-item-{item}`: Menu item links

### Breadcrumb
- `breadcrumb`: Breadcrumb container
- `breadcrumb-home`: Home link
- `breadcrumb-link-{item}`: Breadcrumb links
- `breadcrumb-current-{item}`: Current page indicator

## Demo Page

Visit `/demo-layout` to see all components in action with:
- Interactive demonstrations
- Feature checklists
- Testing instructions
- Responsive behavior showcase

## Styling

All components use:
- **Tailwind CSS**: Utility-first styling
- **shadcn UI**: Accessible component primitives
- **DreamPOS Theme**: Orange primary, dark sidebar
- **Smooth Animations**: Transition classes for all interactions
- **Dark Mode**: Full theme support with proper contrast

## Integration

The layout system is integrated into the app via:
1. `ThemeProvider` wrapper in `App.tsx`
2. Page components use `MainLayout` wrapper
3. Menu structure defined in `config/dreampos-menu.ts`
4. Theme variables in `index.css`
