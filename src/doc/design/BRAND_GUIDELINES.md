# Algo-Grade DAA Portal - Brand & UI Design Guidelines

## 1. Brand Identity

### 1.1 Brand Overview
**Product Name:** Algo-Grade DAA Portal  
**Brand Personality:** Professional, Modern, Clean, Educational, Trustworthy  
**Target Audience:** Students, Professors, Teaching Assistants  

### 1.2 Brand Values
- **Clarity:** Information should be easy to scan and understand
- **Efficiency:** Minimize cognitive load, maximize productivity
- **Accessibility:** Design for all users regardless of ability
- **Consistency:** Uniform experience across all touchpoints
- **Professionalism:** Academic tool with polished, trustworthy appearance

---

## 2. Color System

### 2.1 Primary Palette
The application uses a **neutral monochromatic base** with semantic accent colors for specific purposes.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Main background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Primary actions, buttons |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary elements |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text |

### 2.2 Semantic Colors

| Token | Purpose | Light Mode | Dark Mode |
|-------|---------|-----------|-----------|
| `--destructive` | Errors, deletions, warnings | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--accent` | Highlights, special states | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--ring` | Focus states, selections | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### 2.3 Functional Colors (Difficulty Indicators)

| Difficulty | Background (Light) | Text (Light) | Background (Dark) | Text (Dark) |
|------------|-------------------|--------------|-------------------|-------------|
| **Easy** | `bg-green-100` | `text-green-700` | `bg-green-500/10` | `text-green-400` |
| **Medium** | `bg-yellow-100` | `text-yellow-700` | `bg-yellow-500/10` | `text-yellow-400` |
| **Hard** | `bg-red-100` | `text-red-700` | `bg-red-500/10` | `text-red-400` |

### 2.4 Chart Colors
Used for data visualization and analytics:

```css
--chart-1: oklch(0.87 0 0);
--chart-2: oklch(0.556 0 0);
--chart-3: oklch(0.439 0 0);
--chart-4: oklch(0.371 0 0);
--chart-5: oklch(0.269 0 0);
```

---

## 3. Typography

### 3.1 Font Families
```css
--font-heading: var(--font-inter);
--font-sans: var(--font-inter);
--font-mono: var(--font-plex-mono);
```

### 3.2 Type Scale

| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|----------------|-------------|
| H1 | `text-2xl` (1.5rem) | 600 (semibold) | `-0.025em` | Tight |
| H2 | `text-lg` (1.125rem) | 600 (semibold) | `-0.025em` | Tight |
| H3 | `text-lg` (1.125rem) | 600 (semibold) | Default | Normal |
| Body Large | `text-base` (1rem) | 400 (regular) | Default | Normal |
| Body | `text-sm` (0.875rem) | 400 (regular) | Default | Normal |
| Small | `text-xs` (0.75rem) | 400 (regular) | Default | Normal |
| Caption | `text-xs` (0.75rem) | 400 (regular) | Default | Normal |

### 3.3 Font Weights
- **Regular (400):** Body text, descriptions
- **Medium (500):** Labels, secondary emphasis
- **Semibold (600):** Headings, primary emphasis
- **Bold (700):** Strong emphasis, statistics

---

## 4. Spacing & Layout

### 4.1 Spacing Scale
Based on Tailwind's spacing system:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 0.25rem (4px) | Tight internal spacing |
| `gap-2` | 0.5rem (8px) | Related elements |
| `gap-3` | 0.75rem (12px) | Component internal spacing |
| `gap-4` | 1rem (16px) | Standard spacing |
| `gap-6` | 1.5rem (24px) | Section spacing |
| `gap-8` | 2rem (32px) | Large section spacing |

### 4.2 Page Layout Structure

```
┌─────────────────────────────────────┐
│           Sidebar (Fixed)           │
│  ┌─────────────────────────────┐    │
│  │      Main Content Area      │    │
│  │  ┌───────────────────────┐  │    │
│  │  │   Page Header/Card    │  │    │
│  │  ├───────────────────────┤  │    │
│  │  │                       │  │    │
│  │  │   Content Sections    │  │    │
│  │  │                       │  │    │
│  │  └───────────────────────┘  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 4.3 Container Patterns
- **Page Padding:** `p-4` minimum, `p-6` for spacious layouts
- **Card Padding:** `p-4` to `p-6` depending on content density
- **Section Gap:** `gap-6` between major sections
- **Element Gap:** `gap-4` between related form elements

---

## 5. Components & Patterns

### 5.1 Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | Default | Small elements |
| `rounded-lg` | `var(--radius-md)` | Buttons, inputs |
| `rounded-xl` | `var(--radius-lg)` | Cards, containers |
| `rounded-2xl` | `var(--radius-xl)` | Page sections |
| `rounded-full` | 9999px | Badges, tags |

**Current System Values:**
```css
--radius-sm: calc(var(--radius) * 0.6);
--radius-md: calc(var(--radius) * 0.8);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) * 1.4);
--radius-2xl: calc(var(--radius) * 1.8);
--radius-3xl: calc(var(--radius) * 2.2);
--radius-4xl: calc(var(--radius) * 2.6);
```

### 5.2 Card Pattern
Cards are the primary content container:

```tsx
<div className="rounded-2xl border bg-background p-6 shadow-sm">
  <h2 className="text-lg font-semibold">Title</h2>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```

**Card Variants:**
- **Default:** `rounded-2xl border bg-background p-6 shadow-sm`
- **Compact:** `rounded-xl border bg-card p-4`
- **Interactive:** Add `hover:shadow-md transition-shadow`

### 5.3 Button Hierarchy

| Priority | Variant | Usage |
|----------|---------|-------|
| Primary | `default` | Main actions (Submit, Save, Create) |
| Secondary | `outline` | Secondary actions (Cancel, Back) |
| Tertiary | `ghost` | Low-emphasis actions (View Details) |
| Destructive | `destructive` | Dangerous actions (Delete, Remove) |

**Button Sizes:**
- `default` (h-8): Standard actions
- `lg` (h-9): Primary CTAs
- `sm` (h-7): Compact interfaces
- `icon`: Icon-only buttons

### 5.4 Input Fields

```tsx
<div>
  <label className="mb-2 block text-sm font-medium">Label</label>
  <input
    className="w-full rounded-xl border px-3 py-2 text-sm outline-none 
               focus-visible:border-ring focus-visible:ring-2 
               focus-visible:ring-ring/20"
  />
</div>
```

**Input States:**
- **Default:** `border`
- **Focus:** `border-ring ring-2 ring-ring/20`
- **Error:** `border-destructive ring-destructive/20`
- **Disabled:** `opacity-50 cursor-not-allowed`

### 5.5 Badges & Tags

```tsx
<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
  Content
</span>
```

**Badge Variants:**
- **Default:** `bg-muted`
- **Primary:** `bg-primary text-primary-foreground`
- **Success:** `bg-green-100 text-green-700` (dark: `bg-green-500/10 text-green-400`)
- **Warning:** `bg-yellow-100 text-yellow-700` (dark: `bg-yellow-500/10 text-yellow-400`)
- **Danger:** `bg-red-100 text-red-700` (dark: `bg-red-500/10 text-red-400`)

---

## 6. Interaction & Motion

### 6.1 Transitions
```css
transition: all 0.2s ease;
```

**Common Transition Patterns:**
- Buttons: `transition hover:opacity-90`
- Cards: `transition hover:shadow-md`
- Interactive elements: `transition-colors`

### 6.2 Focus States
All interactive elements must have visible focus states:
```css
focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20
```

### 6.3 Disabled States
```css
disabled:opacity-50 disabled:cursor-not-allowed
```

### 6.4 Loading States
- Use skeleton loaders for content fetching
- Show spinner for in-progress actions
- Disable buttons during submission

---

## 7. Accessibility

### 7.1 Color Contrast
- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text:** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

### 7.2 Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus indicators required
- Logical tab order

### 7.3 Screen Readers
- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Include descriptive labels for form inputs

### 7.4 Error Handling
- Clear error messages near the source
- Use color + icon for error states
- Provide recovery instructions

---

## 8. Dashboard-Specific Guidelines

### 8.1 Admin Dashboard (dashboardAdmin)
**Users:** Professors, TAs  
**Tone:** Professional, Efficient, Data-focused

**Key Patterns:**
- Dense information display
- Quick action buttons
- Bulk operations
- Analytics and statistics
- Management tools

**Color Emphasis:**
- Primary actions in neutral (black/white)
- Destructive actions clearly marked
- Status indicators with semantic colors

### 8.2 Student Dashboard (dashboard)
**Users:** Students  
**Tone:** Encouraging, Clear, Task-oriented

**Key Patterns:**
- Progress indicators
- Deadline highlights
- Achievement displays
- Simplified navigation
- Clear call-to-actions

**Color Emphasis:**
- Softer secondary colors
- Success states emphasized
- Progress/completion indicators

---

## 9. Responsive Design

### 9.1 Breakpoints

| Name | Size | Target |
|------|------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### 9.2 Responsive Patterns

**Grid Layouts:**
```tsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
```

**Conditional Display:**
```tsx
<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
```

**Responsive Sizing:**
```tsx
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

---

## 10. Theme System (Light/Dark Mode)

### 10.1 Theme Architecture
The application supports **two themes** with a toggle button:
- **Light Theme:** Default, professional academic appearance
- **Dark Theme:** Reduced eye strain, modern aesthetic

**Theme Toggle Placement:**
- Located in the **navbar** (top-right corner)
- Accessible from all pages (both admin and student dashboards)
- Persists user preference in localStorage

### 10.2 Implementation
Theme switching via CSS variables:

```tsx
// Toggle mechanism
<html className={theme}> // 'light' or 'dark'

// Theme toggle button
<Button variant="ghost" size="icon" onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### 10.3 Theme Color Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--background` | `oklch(1 0 0)` (White) | `oklch(0.145 0 0)` (Near Black) |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |

### 10.4 Dark Mode Considerations
- Reduce white text to `oklch(0.985 0 0)` (not pure white)
- Use `oklch(0.205 0 0)` for card backgrounds
- Borders use alpha transparency: `oklch(1 0 0 / 10%)`
- Reduce shadow intensity
- Adjust semantic colors for readability
- Ensure sufficient contrast on all interactive elements

### 10.5 Theme Persistence
```tsx
// Store preference
localStorage.setItem('theme', 'dark' | 'light')

// Default to system preference if not set
window.matchMedia('(prefers-color-scheme: dark)').matches
```

---

## 11. Icon System

### 11.1 Icon Library
**Primary:** Lucide React (v0.577.0)  
**Usage:** Consistent 16x16 or 20x20 sizing

### 11.2 Icon Usage
```tsx
// With Button
<Button>
  <Icon className="mr-2" />
  Label
</Button>

// Icon Only
<Button size="icon">
  <Icon />
</Button>
```

### 11.3 Common Icons
- `Plus`: Create/Add
- `Trash2`: Delete
- `Edit`: Modify
- `Search`: Search/Filter
- `Filter`: Filter options
- `ChevronDown`: Expand/Dropdown
- `Check`: Success/Complete
- `X`: Close/Cancel
- `AlertCircle`: Warning/Error
- `Info`: Information

### 11.4 Animated Icons
Icons should have subtle animations to enhance user experience and provide visual feedback.

**Animation Classes:**
```css
/* Pulse animation - for loading/processing states */
.icon-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spin animation - for loading states */
.icon-spin {
  animation: spin 1s linear infinite;
}

/* Bounce animation - for success/attention */
.icon-bounce {
  animation: bounce 1s ease-in-out infinite;
}

/* Shake animation - for errors/warnings */
.icon-shake {
  animation: shake 0.5s ease-in-out;
}

/* Scale pulse - for hover states */
.icon-hover-scale {
  transition: transform 0.2s ease;
}
.icon-hover-scale:hover {
  transform: scale(1.1);
}

/* Rotate on hover */
.icon-hover-rotate {
  transition: transform 0.3s ease;
}
.icon-hover-rotate:hover {
  transform: rotate(15deg);
}
```

**Keyframe Definitions:**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

**Animation Usage Examples:**
```tsx
// Loading state
<Loader2 className="h-4 w-4 icon-spin" />

// Success state
<CheckCircle2 className="h-5 w-5 icon-bounce text-green-500" />

// Error state
<AlertCircle className="h-5 w-5 icon-shake text-destructive" />

// Interactive button
<Button>
  <Plus className="h-4 w-4 icon-hover-scale mr-2" />
  Add Item
</Button>

// Theme toggle
<ThemeToggle>
  <Sun className="h-5 w-5 icon-hover-rotate" />
  <Moon className="h-5 w-5 icon-hover-rotate" />
</ThemeToggle>
```

**Animation Guidelines:**
- **Duration:** Keep animations under 1s for micro-interactions
- **Easing:** Use `ease-in-out` for natural motion
- **Frequency:** Use animations sparingly to avoid distraction
- **Performance:** Use CSS transforms and opacity for smooth 60fps animations
- **Accessibility:** Respect `prefers-reduced-motion` media query

---

## 12. Content Guidelines

### 12.2 Writing Style
- **Clear:** Use simple, direct language
- **Concise:** Minimize word count
- **Action-oriented:** Start with verbs for buttons
- **Consistent:** Use same terms throughout

### 12.3 Button Labels
- Use action verbs: "Create", "Save", "Delete"
- Avoid: "Click here", "Submit" (use specific action)
- Length: 1-3 words maximum

### 12.4 Error Messages
- Explain what went wrong
- Provide solution
- Use friendly, non-blaming tone

**Example:**
```
❌ "Invalid input"
✅ "Please enter a valid email address"
```

---

## 13. Performance Considerations

### 13.1 Loading States
- Show skeletons for content > 200ms load time
- Use optimistic UI updates where possible
- Display progress for long operations

### 13.2 Image Optimization
- Use WebP format when possible
- Implement lazy loading
- Provide appropriate alt text

### 13.3 Component Optimization
- Memoize expensive computations
- Virtualize long lists
- Debounce search inputs

---

## 14. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-27 | Initial brand guidelines |

---

## 15. Resources

### 15.1 Design Tools
- **Component Library:** shadcn/ui (Radix Nova style)
- **Icons:** Lucide React
- **Styling:** Tailwind CSS v4
- **Animations:** CSS transitions

### 15.2 Documentation
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Primitives](https://radix-ui.com)
- [Lucide Icons](https://lucide.dev)

---

*Last Updated: March 27, 2026*  
*Maintained by: Algo-Grade DAA Portal Team*
