# CISM Exam Simulator - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Productivity-Focused)  
**Primary Reference:** Linear + Notion hybrid approach  
**Rationale:** This is a utility-focused learning application where clarity, efficiency, and data organization are paramount. The interface must minimize cognitive load while presenting dense information (questions, answers, explanations, statistics).

**Core Principles:**
- Information hierarchy over decoration
- Scanning efficiency for rapid question navigation
- Clear visual feedback for learning states
- Distraction-free study environment

---

## Layout System

**Spacing Primitives:** Use Tailwind units of `2, 4, 6, 8, 12, 16, 20` (e.g., p-4, gap-6, mt-8)

**Structure:**
- **Sidebar:** Fixed width 280px (w-70), collapsible to icon-only 64px (w-16)
- **Main Content Area:** Fluid with max-w-4xl container for question display
- **Dashboard/Stats:** Full-width with inner max-w-6xl grid layout

**Grid System:**
- Question grid in sidebar: Single column, compact spacing (gap-2)
- Statistics dashboard: 4-column grid (grid-cols-4) for metrics
- Question blocks display: Organized sections with clear dividers

---

## Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono for question IDs/numbers

**Hierarchy:**
- Question text: text-xl (20px), font-normal, leading-relaxed
- Answer options: text-base (16px), font-normal
- Explanations: text-sm (14px), leading-relaxed
- Sidebar items: text-sm (14px), font-medium
- Statistics: text-3xl (30px) for numbers, text-xs (12px) for labels

---

## Component Specifications

### 1. Sidebar Navigation
- **Structure:** Scrollable list of question numbers (1-N)
- **Question Items:**
  - Compact cards (h-12, px-4)
  - Number badge on left
  - Status indicators: Icon/emoji right-aligned
  - States: Not answered (neutral), Correct (checkmark), Incorrect (X), Flagged (flag icon)
- **Block Headers:** Sticky section dividers every 50 questions showing source filename
- **Collapse Button:** Top-right icon toggle

### 2. Question Display Panel
- **Container:** Centered max-w-4xl with generous padding (p-8 to p-12)
- **Structure:**
  - Question number badge (top-left, text-sm, font-mono)
  - Fullscreen toggle (top-right icon button)
  - Question text (mb-8)
  - Answer options as radio button list (space-y-4)
  - Action buttons row: Submit, Mark for Review, Reset Question (mt-8, gap-4)
- **Feedback Section:** Expandable panel below answer (border-t, pt-6, mt-6)
  - Explanation text area
  - Reference citations
- **Comments Area:** Textarea with placeholder "Add your notes..." (mt-6)

### 3. Answer Options
- **Layout:** Vertical stack with radio inputs
- **Option Cards:**
  - Full-width interactive areas (p-4, rounded-lg)
  - Letter prefix (A/B/C/D) in badge format
  - Option text in paragraph format
  - Selected state: subtle outline treatment
  - Answered state: Visual indicator overlay (after submission)

### 4. Statistics Dashboard
- **Grid Layout:** 4 equal columns for key metrics
- **Metric Cards:**
  - Large number display (text-3xl, font-bold)
  - Descriptive label below (text-xs, uppercase, tracking-wide)
  - Progress rings for percentage metrics
- **Secondary Stats:** 2-column layout below for averages/details
- **Charts:** Minimal line/bar charts for performance over time

### 5. Upload Zone
- **Placement:** Accessible from dashboard/home
- **Design:** Dashed border region (border-2, border-dashed, rounded-xl)
  - Centered icon (upload cloud, size-16)
  - Text: "Drag & drop PDF/DOCX" (text-lg)
  - "or click to browse" (text-sm)
  - Minimum height: h-64

### 6. Action Buttons
- **Primary Actions:** Filled buttons (px-6, py-3, rounded-lg, font-medium)
- **Secondary Actions:** Outlined buttons (border-2, px-6, py-3)
- **Icon Buttons:** Square (w-10, h-10), rounded-lg for sidebar/header actions
- **Button Groups:** Clustered with gap-3, responsive stack on mobile

### 7. Modals & Overlays
- **Export Options Modal:** Centered card (max-w-md)
  - Radio group for export type selection
  - Checkboxes for inclusion options
  - Preview section
- **Reset Confirmation:** Simple alert dialog
- **State Import:** File upload with validation feedback

---

## Animations (Minimal)

- **Question Transitions:** Fade + slight upward slide (duration-200)
- **Sidebar Toggle:** Smooth width transition (transition-all, duration-300)
- **Button Interactions:** No hover animations (per guidelines)
- **Statistics Updates:** Counter animations for numbers (subtle)
- **Progress Rings:** Animated fill on load (duration-1000, ease-out)

---

## Accessibility

- Keyboard navigation: Tab through questions, Enter to select
- ARIA labels for all icon-only buttons
- Focus visible states for all interactive elements
- Screen reader announcements for answer feedback
- High contrast ratios maintained throughout (handled by color implementation)

---

## Icons

**Library:** Heroicons (via CDN)  
**Usage:**
- Navigation: ChevronLeftIcon, ChevronRightIcon, Bars3Icon
- Status: CheckCircleIcon, XCircleIcon, FlagIcon
- Actions: ArrowPathIcon (reset), CloudArrowUpIcon (upload), ArrowsPointingOutIcon (fullscreen)
- Interface: ChartBarIcon, DocumentTextIcon, Cog6ToothIcon

---

## Responsive Behavior

- **Desktop (lg+):** Sidebar always visible, multi-column stats
- **Tablet (md):** Sidebar collapsible, 2-column stats grid
- **Mobile (base):** Sidebar as overlay drawer, single-column everything, bottom-fixed navigation

This design creates a professional, distraction-free learning environment optimized for focused study sessions while maintaining comprehensive feature access.