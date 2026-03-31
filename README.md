# 🎯 Algo-Grade DAA Portal

> **A Modern Auto-Grading Platform for Design & Analysis of Algorithms**  
> Built for IIITDMJ • Powered by Next.js 16 • Real-time Code Execution

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Clerk](https://img.shields.io/badge/Clerk-7.0.6-6c47ff?logo=clerk)
![MongoDB](https://img.shields.io/badge/MongoDB-7.1-47A248?logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Models](#-database-models)
- [Key Workflows](#-key-workflows)
- [Admin Management](#-admin-management)
- [Utilities & Scripts](#-utilities--scripts)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**Algo-Grade** is a full-stack web application designed to streamline the assignment submission and auto-grading process for the **Design & Analysis of Algorithms (DAA)** course at **IIITDMJ**.

### What It Does

- 👨‍🎓 **Students** can write, test, and submit algorithm solutions in multiple languages
- 🤖 **Auto-grading** with real-time feedback using Piston (Docker-based code execution)
- 👨‍🏫 **Admins** can create problems, assignments, and view analytics
- 📊 **Instant results** with detailed test case breakdowns
- 🌓 **Beautiful UI** with dark/light mode support

### Core Value Proposition

| Traditional | Algo-Grade |
|-------------|------------|
| Manual grading (days) | Instant auto-grading (seconds) |
| Limited test cases | Comprehensive test coverage |
| No code execution history | Full submission history |
| Email submissions | Centralized platform |
| Subjective evaluation | Objective, test-based scoring |

---

## ✨ Features

### 🔐 Authentication & Authorization

- **Clerk Integration** - Secure OAuth with Google, GitHub, Email
- **Role-Based Access** - Separate dashboards for students and admins
- **IIITDMJ Email Validation** - Auto-extract roll numbers from `@iiitdmj.ac.in` emails
- **Onboarding Flow** - Seamless profile completion with roll number detection

### 📝 Assignment Management

- **Create Problems** - Add descriptions, constraints, examples, test cases
- **Multi-language Support** - C++, Java, Python, JavaScript
- **Starter Code Templates** - Pre-filled code for each language
- **Difficulty Levels** - Easy, Medium, Hard tagging
- **Marks Distribution** - Custom marks per problem

### 🚀 Code Execution & Auto-Grading

- **Real-time Compilation** - Powered by Piston (self-hosted Docker)
- **Test Case Execution** - Hidden and visible test cases
- **Performance Metrics** - Execution time and memory usage tracking
- **Detailed Feedback** - Expected vs actual output comparison
- **Re-submission Allowed** - Students can improve their solutions

### 📊 Analytics & Dashboard

- **Student Progress** - Track completed assignments and scores
- **Admin Analytics** - View submission statistics and performance
- **Assignment Overview** - Due dates, completion status, total marks
- **Test Results Display** - Collapsible, color-coded test case results

### 🎨 User Experience

- **Modern UI** - Built with shadcn/ui components
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Full theme support with `next-themes`
- **Code Editor** - Monaco/CodeMirror with syntax highlighting
- **Toast Notifications** - Real-time success/error feedback
- **Loading States** - Spinners and progress indicators

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.2.1 | React framework with App Router |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | Latest | Beautiful UI components |
| **Radix UI** | 1.4.3 | Accessible primitives |
| **Lucide React** | 0.577.0 | Icon library |
| **next-themes** | 0.4.6 | Dark/light mode |
| **Motion** | 12.38.0 | Animations |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 7.1.0 | NoSQL database |
| **Mongoose** | 9.3.1 | ODM for MongoDB |
| **Clerk** | 7.0.6 | Authentication & user management |
| **Inngest** | 4.0.4 | Background jobs & workflows |
| **Zod** | 4.3.6 | Schema validation |

### Code Execution

| Technology | Version | Purpose |
|------------|---------|---------|
| **Piston** | Latest | Code execution engine |
| **Docker** | Latest | Sandboxed execution |
| **CodeMirror** | 6.x | Code editor component |

### Data Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.15.4 | Charts and graphs |
| **date-fns** | 4.1.0 | Date manipulation |

---

## 🏗️ Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │   Student    │  │    Admin     │          │
│  │    Page      │  │  Dashboard   │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↓                  ↓                  ↓                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │           Clerk Authentication Provider            │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js App Router (API Routes)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │ /api/    │  │ /api/    │  │ /api/    │  │ /api/    │ │   │
│  │  │onboarding│  │ student  │  │  admin   │  │ compile  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Business Logic Layer                     │   │
│  │  - Authentication Middleware (proxy.ts)                  │   │
│  │  - Route Protection & Role Checks                        │   │
│  │  - Request Validation (Zod)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │    Piston    │  │   Clerk DB   │          │
│  │  (Problems,  │  │  (Docker API │  │   (Users,    │          │
│  │  Users, etc) │  │   for Code)  │  │   Sessions)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow: Student Submission

```
Student clicks "Save"
        ↓
Frontend: POST /api/student/submissions
        ↓
Backend: Fetch problem test cases
        ↓
Backend: POST /api/compile
        ↓
Piston: Execute code in Docker
        ↓
Piston: Run test cases, compare outputs
        ↓
Backend: Save submission to MongoDB
        ↓
Frontend: Display results with UI feedback
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **npm/pnpm/yarn** package manager
- **MongoDB** instance (local or Atlas)
- **Clerk Account** ([Sign up](https://clerk.com/))
- **Docker** (for Piston code execution)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd daa-portal
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/daa-portal
# or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daa-portal

# Admin Setup (for creating initial admin)
ADMIN_SETUP_SECRET=your_super_secret_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. Set Up Piston (Code Execution)

```bash
# Run Piston in Docker
docker run -d --name piston --privileged -p 2000:2000 \
  ghcr.io/engineer-man/piston:latest
```

Verify Piston is running:
```bash
curl http://localhost:2000/api/v2/languages
```

#### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
daa-portal/
├── 📂 src/
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── 📂 (auth)/               # Authentication pages
│   │   │   └── LandingPage.tsx
│   │   ├── 📂 (dashboard)/          # Student dashboard layout
│   │   ├── 📂 (dashboardAdmin)/     # Admin dashboard layout
│   │   ├── 📂 admin/                # Admin pages
│   │   ├── 📂 api/                  # API routes
│   │   │   ├── 📂 admin/            # Admin endpoints
│   │   │   ├── 📂 compile/          # Code execution
│   │   │   ├── 📂 inngest/          # Background jobs
│   │   │   ├── 📂 onboarding/       # Profile completion
│   │   │   ├── 📂 student/          # Student endpoints
│   │   │   └── 📂 users/            # User management
│   │   ├── 📂 onboarding/           # Onboarding flow
│   │   ├── 📂 setup-admin/          # Admin setup page
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Entry point
│   │   └── globals.css              # Global styles
│   │
│   ├── 📂 components/
│   │   ├── 📂 ui/                   # shadcn/ui components (55+)
│   │   ├── providers.tsx            # Clerk & Theme providers
│   │   └── SignInModalButton.tsx
│   │
│   ├── 📂 models/                   # Mongoose schemas
│   │   ├── User.ts                  # User schema (admin/student)
│   │   ├── Problem.ts               # Problem schema
│   │   ├── Assignment.ts            # Assignment schema
│   │   ├── Submission.ts            # Submission schema
│   │   └── Announcement.ts          # Announcement schema
│   │
│   ├── 📂 lib/                      # Utilities
│   │   ├── db.ts                    # MongoDB connection
│   │   ├── piston.ts                # Piston API wrapper
│   │   └── utils.ts                 # Helper functions
│   │
│   ├── 📂 inngest/                  # Background functions
│   │   └── functions.ts
│   │
│   ├── proxy.ts                     # Clerk middleware
│   └── doc/                         # Documentation
│
├── 📂 scripts/                      # Utility scripts
│   ├── get-users.js                 # List all users
│   ├── drop-rollno-index.js         # Fix duplicate key errors
│   ├── sync-pending-admins.js       # Check pending admins
│   ├── cleanup-admins.js            # Admin audit utility
│   └── README.md                    # Scripts documentation
│
├── 📂 public/                       # Static assets
├── 📂 types/                        # TypeScript types
│   └── globals.d.ts
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🗄️ Database Models

### User

Base schema for both students and admins.

```typescript
interface IUser {
  clerkId: string;           // Clerk user ID
  name?: string;             // Full name
  email?: string;            // Email address
  rollNo?: string;           // Roll number (students only)
  role: "admin" | "student"; // User role
  createdAt: Date;
  updatedAt: Date;
}
```

### Problem

Coding problems with test cases and starter code.

```typescript
interface IProblem {
  title: string;
  slug: string;
  description: string;
  constraints: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  marks: number;
  examples: { input, output, explanation }[];
  testCases: { input, output, isHidden }[];
  starterCode: { cpp, java, python, javascript };
  createdBy?: ObjectId;
}
```

### Assignment

Collection of problems with deadlines.

```typescript
interface IAssignment {
  title: string;
  description: string;
  totalProblems: number;
  totalMarks: number;
  publishAt: Date;
  dueAt: Date;
  problemIds: ObjectId[];
  createdBy?: ObjectId;
}
```

### Submission

Student code submissions with execution results.

```typescript
interface ISubmission {
  assignmentId: ObjectId;
  problemId: ObjectId;
  userId: ObjectId;
  code: string;
  language: string;
  status: "Attempted" | "Submitted" | "Evaluated";
  score?: number;
  testResults: {
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
  }[];
  executionTime?: number;
  memoryUsed?: number;
}
```

---

## 🔄 Key Workflows

### 1. Student Onboarding

```
1. User signs in with IIITDMJ email (rollNo@iiitdmj.ac.in)
        ↓
2. Redirected to /onboarding
        ↓
3. Roll number auto-extracted from email
        ↓
4. User confirms name and submits
        ↓
5. Backend updates Clerk metadata + MongoDB
        ↓
6. Redirected to /home (student dashboard)
```

### 2. Assignment Submission

```
1. Student writes code in editor
        ↓
2. Clicks "Save" button
        ↓
3. Frontend sends code to /api/student/submissions
        ↓
4. Backend fetches problem test cases
        ↓
5. Calls /api/compile with code + test cases
        ↓
6. Piston executes code in Docker sandbox
        ↓
7. Results returned with pass/fail per test
        ↓
8. Submission saved to MongoDB (if all tests pass)
        ↓
9. UI displays detailed results with metrics
```

### 3. Admin Creation

```
1. Admin accesses /setup-admin with secret
        ↓
2. Enters email and name
        ↓
3. Backend creates user with clerkId: "pending_<email>"
        ↓
4. Admin signs in with Clerk
        ↓
5. Middleware detects pending admin
        ↓
6. Updates clerkId and Clerk metadata
        ↓
7. Redirects to /admin dashboard
```

---

## 👨‍💼 Admin Management

### Setting Up Initial Admin

#### Method 1: Via Dashboard (Recommended)

1. Navigate to `/setup-admin`
2. Enter admin email and name
3. Provide `ADMIN_SETUP_SECRET` from environment
4. Submit form

#### Method 2: Via API

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@iiitdmj.ac.in",
    "name": "Admin Name"
  }'
```

### Admin Scripts

Manage admins with utility scripts:

```bash
# View all users
node scripts/get-users.js

# Check admin status (pending/active)
node scripts/cleanup-admins.js

# Fix duplicate key errors
node scripts/drop-rollno-index.js
```

See [`scripts/README.md`](scripts/README.md) for detailed documentation.

---

## 🛠️ Utilities & Scripts

The project includes several utility scripts for database management:

| Script | Purpose | Usage |
|--------|---------|-------|
| `get-users.js` | Display all users | `node scripts/get-users.js` |
| `drop-rollno-index.js` | Remove problematic index | `node scripts/drop-rollno-index.js` |
| `sync-pending-admins.js` | List pending admins | `node scripts/sync-pending-admins.js` |
| `cleanup-admins.js` | Full admin audit | `node scripts/cleanup-admins.js` |

**Note:** Update `MONGODB_URI` in each script before running.

---

## 📝 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route | `/sign-up` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://...` |
| `ADMIN_SETUP_SECRET` | Secret for admin creation | `your_secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Start Inngest dev server (background jobs)
npm run dev:inngest

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Next.js recommended config
- **Prettier** - Auto-formatted on save

### Testing

```bash
# Run tests (when implemented)
npm test
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
# Build
npm run build

# Start
npm run start

# Or use PM2
pm2 start npm --name "daa-portal" -- start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Write clear, documented code
- Test your changes thoroughly
- Follow the existing code style

---

## 📄 License

This project is proprietary software developed for IIITDMJ's DAA course.

---

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React Framework
- **[Clerk](https://clerk.com/)** - Authentication platform
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components
- **[Piston](https://github.com/engineer-man/piston)** - Code execution engine
- **[MongoDB](https://www.mongodb.com/)** - Database platform

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

---

**Built with ❤️ by the Algo-Grade Team**  
*IIITDMJ • Design & Analysis of Algorithms*
