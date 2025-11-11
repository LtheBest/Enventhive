# TEAMMOVE Design Guidelines

## Design Approach: Carbon Design System
**Rationale**: Enterprise SaaS platform with complex data visualization, multi-dashboard architecture, and professional B2B audience. Carbon Design System provides the robust foundation needed for information-dense interfaces while maintaining clarity and usability.

**Key Principles**:
- Data clarity over decoration
- Consistent, predictable patterns across all dashboard types
- Professional, trustworthy aesthetic suitable for enterprise clients
- Efficient information hierarchy for quick decision-making

---

## Typography

**Font Stack**: IBM Plex Sans (via Google Fonts CDN)
- **Headers**: 
  - H1: text-4xl font-semibold (Dashboard titles, page headers)
  - H2: text-2xl font-semibold (Section headers)
  - H3: text-xl font-medium (Card headers, subsections)
- **Body**: 
  - Primary: text-base (Standard content, form labels)
  - Secondary: text-sm (Helper text, metadata, table data)
  - Small: text-xs (Timestamps, badges, footnotes)
- **Accent**: 
  - Numeric data/KPIs: text-3xl font-bold (Dashboard metrics)
  - Buttons: text-sm font-medium uppercase tracking-wide

---

## Layout System

**Spacing Primitives** (Tailwind units): **2, 3, 4, 6, 8, 12, 16**
- Tight spacing: gap-2, p-2 (dense tables, compact cards)
- Standard spacing: gap-4, p-4 (form fields, card content)
- Section spacing: gap-6, py-6 (between form sections)
- Major spacing: gap-8, p-8 (page padding, card containers)
- Large spacing: gap-12, py-12 (dashboard sections)
- Extra large: py-16 (marketing pages only)

**Grid System**:
- Dashboard containers: max-w-7xl mx-auto px-4
- Content areas: grid grid-cols-12 gap-6
- Responsive breakpoints: Mobile (base) → Tablet (md:) → Desktop (lg:) → Wide (xl:)

---

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header, h-16, logo left, user menu/notifications right, plan badge
- **Sidebar Navigation**: w-64, collapsible to w-16 on mobile, hierarchical menu structure
- **Breadcrumbs**: text-sm with chevron separators for deep navigation

### Dashboard Components
- **Stat Cards**: Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4), large number display, trend indicators, icon top-left
- **Event Cards**: Image thumbnail left (if event has photo), title/date/participants right, action buttons bottom-right, border-l-4 for status indication
- **Data Tables**: Sticky header, alternating row backgrounds, hover states, sortable columns, pagination footer, 10-15 rows per page
- **Quick Actions Panel**: Floating action button (FAB) bottom-right for primary actions (Create Event, Add Participant)

### Forms
- **Input Fields**: Full-width labels above inputs, helper text below, error states with red border-l-4, success states with green checkmark icon
- **Multi-Step Forms** (Registration): Progress stepper top, numbered circles, connecting lines, current step highlighted
- **Auto-complete** (Addresses): Dropdown suggestions max-h-64 overflow-y-auto, highlight matching text
- **File Upload**: Drag-drop zone with dashed border, preview thumbnails, progress bars for uploads

### Modals & Overlays
- **Confirmation Dialogs**: max-w-md, centered, title + description + actions (Cancel/Confirm), backdrop blur
- **Detail Panels**: Slide-in from right (w-96 lg:w-1/3), close button top-right, scrollable content
- **Toasts/Notifications**: Top-right positioning, auto-dismiss 5s, icon left (success/error/info), close button

### Plan-Specific Elements
- **Plan Badge**: Pill-shaped, uppercase text-xs, positioned top-right of dashboard header (Découverte/Essentiel/Pro/Premium)
- **Feature Lock States**: Blurred preview with overlay "Upgrade to [Plan] to unlock", CTA button centered
- **Upgrade Prompts**: Inline banners with gradient background, dismissible, appear contextually when approaching limits

---

## Images

### Dashboard Images
- **Event Thumbnails**: 16:9 aspect ratio, 240px width, object-cover, rounded-lg, used in event cards/lists
- **Company Logo**: Circular crop, 48px diameter in header, 120px in profile settings
- **Empty States**: Centered illustrations (400px max-width) for "No events yet", "No participants", etc.

### Marketing/Landing Pages
- **Hero Section**: Full-width background image with gradient overlay, h-screen (lg:h-[600px]), content centered-left with max-w-2xl
- **Feature Showcases**: Alternating image-left/text-right and text-left/image-right sections, images max-w-lg, screenshots with subtle shadow and border
- **Testimonial Images**: Circular headshots, 64px diameter, positioned left of quote text

---

## Animations

**Strictly Minimal**:
- Hover states: Scale 1.02 on cards (transition-transform duration-200)
- Loading states: Skeleton screens (pulse animation) for data fetching
- Modal entry: Fade + slide-up (duration-300)
- **NO** scroll-triggered animations, parallax, or decorative motion

---

## Accessibility

- Focus rings: ring-2 ring-offset-2 on all interactive elements
- Skip navigation link for keyboard users
- ARIA labels on icon-only buttons
- Color contrast minimum 4.5:1 for body text, 3:1 for large text
- Form errors announced via aria-live regions

---

## Responsive Patterns

**Mobile** (base):
- Single column layouts
- Collapsible sidebar → hamburger menu
- Stat cards stack vertically
- Tables switch to card view (each row becomes expandable card)

**Tablet** (md:):
- 2-column stat grids
- Sidebar visible as rail (icons only)
- Tables remain tables with horizontal scroll if needed

**Desktop** (lg:+):
- Full sidebar expanded
- 3-4 column stat grids
- Multi-column forms (grid-cols-2)
- Side-by-side comparison views

---

**Final Note**: Every component should feel purposeful and data-driven. Avoid empty space that doesn't serve information hierarchy. Dense, scannable layouts are preferred over sparse, artistic layouts. Trust indicators (plan badges, verification icons, security callouts) should be prominent throughout the platform.