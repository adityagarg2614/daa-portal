# Algo-Grade - DAA Portal

A modern, full-stack web application for the **Design & Analysis of Algorithms (DAA)** course at IIITDMJ. Built with Next.js 16, Clerk authentication, and MongoDB, Algo-Grade provides an automated grading platform for algorithm coursework.

## Features

### Current Implementation

- **🎨 Modern Landing Page** - Beautiful, responsive homepage with animated gradients and feature cards
- **🔐 Clerk Authentication** - Secure sign-in/sign-up with role-based access control
- **📝 Onboarding Flow** - Automatic roll number extraction from IIITDMJ college emails (`@iiitdmj.ac.in`)
- **👥 Role-Based Dashboards** - Separate portals for students and admins
- **🌓 Dark/Light Mode** - Full theme support using `next-themes`
- **🎯 Auto-Grading Ready** - Infrastructure prepared for automated algorithm evaluation

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.2.1 (App Router) |
| **Language** | TypeScript 5 |
| **Authentication** | Clerk (@clerk/nextjs v7) |
| **Database** | MongoDB (Mongoose v9) |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Charts** | Recharts |

## Project Structure

```
daa-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages (Landing)
│   │   ├── admin/           # Admin dashboard
│   │   ├── api/
│   │   │   └── onboarding/  # Onboarding API routes
│   │   ├── home/            # Student dashboard
│   │   ├── onboarding/      # Profile completion flow
│   │   ├── layout.tsx       # Root layout with providers
│   │   └── page.tsx         # Entry point with auth logic
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (55+)
│   │   ├── providers.tsx    # Clerk & Theme providers
│   │   └── SignInModalButton.tsx
│   ├── models/
│   │   ├── Admin.ts         # Admin Mongoose schema
│   │   └── Student.ts       # Student Mongoose schema
│   └── proxy.ts             # Clerk middleware for route protection
├── components/
│   └── ui/                  # Duplicated shadcn components
├── lib/
│   └── utils.ts             # Utility functions (cn helper)
├── types/
│   └── globals.d.ts         # Global TypeScript declarations
└── public/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm/pnpm/yarn
- A Clerk account (for authentication)
- MongoDB connection string

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daa-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   MONGODB_URI=mongodb://localhost:27017/daa-portal
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Authentication Flow

1. User visits the landing page
2. Clicks "Get Started" → Opens Clerk modal
3. Signs in with IIITDMJ email (`rollNo@iiitdmj.ac.in`)
4. Redirected to onboarding to complete profile
5. Roll number auto-extracted from email
6. After onboarding → routed to student/admin dashboard

## User Roles

- **Student** - Submit algorithm solutions, view grades, track progress
- **Admin** - Manage assignments, view analytics, grade submissions

## Database Models

### Student
```typescript
{
  name: string,
  rollNo: string,      // e.g., "22bcs010"
  clerkUserId: string,
  // ... additional fields
}
```

### Admin
```typescript
{
  name: string,
  clerkUserId: string,
  // ... additional fields
}
```

## UI Components

The project includes 55+ shadcn/ui components:
- Forms (input, textarea, checkbox, radio, select)
- Overlays (dialog, sheet, drawer, popover)
- Navigation (breadcrumb, tabs, pagination)
- Data Display (table, card, badge, avatar)
- Charts (bar, line, pie, area)
- And more...

## License

This project is proprietary software developed for IIITDMJ's DAA course.

---

**Built with ❤️ using Next.js 16 & Clerk**
