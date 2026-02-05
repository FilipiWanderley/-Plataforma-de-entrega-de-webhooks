# UI/UX Guide & Design System

This document outlines the design decisions, component patterns, and accessibility standards for the Webhook Delivery Platform's frontend applications (Angular OPS Console & React Client Portal).

## 1. Theme Decisions

Both applications share a "Premium Enterprise" aesthetic, characterized by clean typography, consistent spacing, and subtle depth.

### Color Palette
| Semantic | Color | Hex | Usage |
|----------|-------|-----|-------|
| **Primary** | Indigo / Blue | `#3f51b5` (Ng) / `#1976d2` (React) | Primary actions, headers, active states |
| **Secondary** | Pink / Blue-Grey | `#e91e63` (Ng) / `#6b778c` (React) | Accents, secondary text |
| **Success** | Green | `#2e7d32` | Active, Succeeded, Enabled states |
| **Warning** | Orange | `#ed6c02` | Paused, Retrying states |
| **Error** | Red | `#d32f2f` | Failed, Blocked, DLQ states |
| **Background** | Neutral | `#f5f5f5` | Page background |
| **Surface** | White | `#ffffff` | Cards, Dialogs, Sidebars |

### Typography
*   **Font Family:** `Inter`, `Roboto`, `Helvetica`, `Arial`, sans-serif
*   **Weights:**
    *   Regular (400): Body text
    *   Medium (500): Buttons, Subtitles
    *   Semi-Bold (600): Headers (H1-H6)
*   **Monospace:** Used for IDs, Hash Signatures, and JSON payloads.

### Shape & Spacing
*   **Border Radius:** `12px` for Cards and Dialogs (Soft, modern look).
*   **Spacing Unit:** `8px` (Material Design standard).
    *   Grid Gaps: `24px` (3 units) typically.
    *   Card Padding: `16px` or `24px`.

## 2. Component Patterns

### Page Layout
*   **PageHeader:** Located at the top of every main view. Contains the page title (H4/H5) and primary page actions (e.g., "Create Endpoint", "Replay All").
*   **Container:** Content is centered with a max-width (typically `1200px` or `xl`) to prevent stretching on large screens.

### Data Display
*   **CardSection:** Used to group related content. Should have a subtle border (`1px solid rgba(0,0,0,0.08)`) and minimal/no shadow (`elevation0` or `elevation1`).
*   **Tables:**
    *   **Sticky Headers:** Enabled for long lists.
    *   **IDs:** Displayed in monospace, often truncated, with a **Copy Button** nearby.
    *   **Pagination:** Standard Material pagination at the bottom.

### States (DataState Pattern)
Every data-fetching view must handle 3 states explicitly:
1.  **Loading:** Skeletons (preferred) or Circular Progress spinner.
2.  **Empty:** Friendly illustration/icon with text explaining why it's empty and a call-to-action if applicable.
3.  **Error:** Red alert/banner with a "Retry" button.

### Feedback
*   **ConfirmDialog:** Required for destructive actions (Delete, Block, Replay All).
*   **Toast/Snackbar:** Required for asynchronous success/failure feedback (e.g., "ID copied to clipboard", "Endpoint paused").
    *   Success: Green
    *   Error: Red

## 3. Status Chip Mapping

Uniform status colors across both apps:

| Status Key | Color | Semantic |
|------------|-------|----------|
| `active`, `enabled`, `succeeded` | **Success** (Green) | Operational / Good |
| `paused`, `retrying` | **Warning** (Orange) | Needs Attention / Temporary |
| `failed`, `blocked`, `dlq` | **Error** (Red) | Critical / Bad |
| `pending`, `processing` | **Info** (Blue) | In Progress |
| `disabled`, others | **Default** (Grey) | Inactive / Neutral |

## 4. Accessibility (A11y) Standards

*   **Icon Buttons:** Must have an `aria-label` (e.g., `aria-label="Copy ID"`).
*   **Focus Management:** Dialogs must trap focus. Closing a dialog returns focus to the trigger element.
*   **Keyboard Nav:** Tables and Lists must be navigable via Tab/Arrow keys.
*   **Contrast:** Ensure text contrast ratios meet WCAG AA (automatically handled by Material palettes mostly, but watch custom pills).

## 5. QA Checklist

### Build & Deploy
- [ ] Angular App builds without error (`ng build`)
- [ ] React App builds without error (`npm run build`)
- [ ] No linting errors in console

### UI/UX Consistency
- [ ] Font is Inter across the board.
- [ ] Cards have `12px` radius.
- [ ] Toast notifications appear for Copy actions.
- [ ] Sticky headers work on scrolling tables.

### Functionality
- [ ] Login works (mock/real).
- [ ] Navigation works (active links highlighted).
- [ ] Data tables sort and paginate.
- [ ] Copy buttons actually copy to clipboard.

## 6. Screenshots

Place screenshots in `/docs/screenshots`.
Recommended captures:
1.  **Login Screen** (Clean, centered)
2.  **Dashboard** (Metrics cards, layout)
3.  **DLQ List** (Table with chips and filters)
4.  **DLQ Detail** (Payload viewer, monospace font)
5.  **Endpoint Control** (Dialogs, status toggles)
