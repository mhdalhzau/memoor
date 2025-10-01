# Overview
This is a multi-role employee management system built with React, TypeScript, Express, and MySQL. It serves staff, managers, and administrators with different access levels for attendance tracking, sales reporting, cashflow management, payroll processing, and proposal submissions. The system supports multiple stores and includes robust role-based authentication and authorization. Key capabilities include comprehensive dashboards with interactive data visualizations, intelligent sales record shift auto-detection, editable sales details with full transaction data modification, and an enhanced UI/UX framework.

# Recent Changes (October 1, 2025)
## Replit Environment Setup
- **GitHub Import**: Successfully imported and configured the project for the Replit environment
- **Workflow Configuration**: Set up "Start application" workflow to run `npm run dev` on port 5000 with webview output
- **Deployment Configuration**: Configured autoscale deployment with proper build and start commands
- **Git Ignore**: Enhanced .gitignore to include Node.js, Python, database backups, logs, and IDE-specific files
- **Vite Configuration**: Verified Vite is properly configured with:
  - Host set to 0.0.0.0 for Replit proxy compatibility
  - Port 5000 for frontend
  - AllowedHosts set to true in middleware mode for proper iframe proxy support
- **Database**: Confirmed MySQL (Aiven) connection is working with SSL
- **Application Status**: Frontend and backend successfully running and accessible

# Previous Changes (September 30, 2025)
## Bulk Delete Functionality
- **Sales Records**: Added checkbox-based bulk delete with confirmation dialog showing selected records details
- **Cashflow Records**: Implemented bulk delete with multi-record selection and detailed confirmation UI
- **Piutang Records**: Added bulk delete functionality adapted to the collapsible customer-grouped structure
- All bulk delete operations include:
  - Individual record checkboxes with data-testid attributes
  - "Select All" checkbox for batch selection
  - Visual indication for selected items (blue highlight)
  - Confirmation dialog with record details preview
  - Loading states during deletion
  - Success toast notifications
  - Automatic data refresh and selection clearing

## Design System Enhancements
- **Color Palette**: Updated to calmer, neutral backgrounds with improved contrast in both light and dark modes
- **Spacing**: Doubled base spacing to 0.5rem for more generous, comfortable layouts
- **Shadows**: 
  - Light mode: Subtle shadows (0.03-0.12 alpha) for gentle elevation
  - Dark mode: Professional shadows (0.06-0.18 alpha) with increased blur radii for depth without muddiness
- **Typography**: Normalized hierarchy with proper H1-H6 scales, improved line heights, and consistent text sizing:
  - H4 for section titles
  - text-sm for data/content  
  - text-xs for metadata/labels
- **Professional Touches**: Subtle borders, consistent badge styling, smooth transitions for interactive elements

# User Preferences
I prefer detailed explanations.

# System Architecture
The system employs a client-server architecture using React/Vite for the frontend and an Express.js server for the backend. Data persistence is managed by a MySQL database.

## UI/UX Decisions
- **Comprehensive UI/UX Enhancement Framework**: A complete design system with over 100 utility classes.
- **Form & Input System**: Enhanced inputs, floating labels, validation feedback, input groups.
- **Table Enhancements**: Zebra striping, hover effects, sticky headers, mobile card view.
- **Card Components**: Consistent shadows, hover lift effects, gradient borders, status cards.
- **Button States**: Loading spinners, icon positioning, proper disabled states.
- **Modal/Dialog System**: Backdrop blur, smooth animations (slideUp, fadeIn), better sizing.
- **Search & Filter**: Enhanced search bars, filter chips, improved pagination.
- **Empty States**: Professional empty state designs with icons and actionable messages.
- **Responsive Utilities**: Mobile-first design, touch-friendly controls, adaptive layouts.
- **Dashboard**: Professional dashboard with 6 interactive charts (Sales Trends, Sales Comparison, Payment Distribution, Attendance Summary, Cashflow Trends, Product Performance) using Recharts, advanced filtering, and responsive design.

## Technical Implementations
- **Frontend**: React/Vite application.
- **Backend**: Express.js server with WebSocket support.
- **Authentication**: Passport.js with session cookies.
- **Role-Based Access Control**: Different access levels for staff, managers, and administrators.
- **Sales Record Shift Auto-Detection**: Intelligent shift detection based on check-in time and store shifts configuration. Special handling for specific users (e.g., "Endang" always assigned "full-day").
- **Editable Sales Details**: Fully editable "Detail Penjualan Per Shift" (Sales Details Per Shift) with the ability to modify all transaction fields including shift info (shift, check-in/out times), meter readings (start, end, total liters), payment breakdown (cash, QRIS), and dynamic income/expense items (add, edit, remove). Automatic total calculation and backend PUT endpoint for updates.
- **Cashflow Management**: Manual cashflow control, with sales records no longer automatically creating cashflow entries.
- **Attendance Status Enhancement**: Automatic clearing of time fields and disabling of inputs when status is "cuti" (leave) or "alpha" (absent). Backend fix for saving attendance status without time data.
- **Cascading Deletes**: Implemented for sales, cashflow, and piutang records to ensure data integrity upon deletion.
- **Error Handling**: Global Express error handler for JSON responses, client-side error parsing, detailed logging, and proper HTTP status codes.

## Feature Specifications
- **Multi-role access**: Staff, Manager, Administrator.
- **Core Functions**: Attendance tracking, sales reporting, cashflow management, payroll processing, proposal submissions.
- **Multi-store support**.
- **Sales Averages**: Expanded precision for `average_ticket` field to `DECIMAL(12,2)` and added division-by-zero guards.
- **Payroll**: Corrected SQL queries for payroll generation and retrieval.
- **QRIS Payment Integration**: Automatic `piutang` creation for QRIS amounts to managers, with correct fee handling and cashflow entries. Store-specific customer logic for QRIS receivables.

## System Design Choices
- **Database Schema Improvements**: `id: true` in `insertStoreSchema` omit clause for store creation, expanded precision for `averageTicket`.
- **Modularity**: Separation of concerns between frontend and backend.

# External Dependencies
- **MySQL**: Aiven MySQL database with SSL connection.
- **Recharts**: Library for interactive data visualizations in the dashboard.
- **react-to-print**: Used for printing payroll details and salary slips.