# Welcome Email System with Resend - Implementation Plan

## Overview
Add email notification functionality when admins create new users. After user creation, a dialog will appear offering to send a welcome email with the temporary password. Emails will be sent using **Resend** service with a beautiful, branded HTML template matching the Algo-Grade portal design.

---

## Current State
- ✅ User creation works (Clerk + MongoDB)
- ✅ Auto-generates temporary password
- ✅ Shows password in UI with copy button
- ❌ No email notification sent to new users
- ❌ Resend not integrated yet

---

## Architecture

### 1. Dependencies to Add

**Package:** `resend` (official Resend SDK)
```bash
npm install resend
```

**Environment Variable:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

---

### 2. Email Service: `/lib/email.ts`

**Purpose:** Centralized email sending utility with Resend

**Functions:**
```typescript
// Send welcome email to new user
async function sendWelcomeEmail(data: {
    to: string
    name: string
    password: string
    role: "admin" | "student"
    rollNo?: string
}): Promise<{ success: boolean; error?: string }>

// Send using Resend
async function sendEmail(options: EmailOptions): Promise<boolean>
```

**Implementation:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail({ to, name, password, role, rollNo }) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Algo-Grade <onboarding@resend.dev>', // Will use custom domain later
            to: [to],
            subject: 'Welcome to Algo-Grade - Your Account Details',
            html: generateWelcomeEmailHTML({ name, password, role, rollNo }),
        })

        if (error) {
            console.error('Failed to send email:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Email sending failed:', error)
        return { success: false, error: 'Failed to send email' }
    }
}
```

---

### 3. Email Template: `/lib/email-templates/welcome-email.tsx`

**Purpose:** Beautiful, branded HTML email template

**Design Elements:**
- **Header**: Algo-Grade logo with gradient (indigo → purple → pink)
- **Welcome Message**: Personalized greeting with user's name
- **Account Details Card**: 
  - Name
  - Email
  - Role (Admin/Student badge)
  - Roll Number (if student)
  - **Temporary Password** (prominent, copyable)
- **Login Instructions**: Step-by-step guide
- **Call-to-Action Button**: "Login to Algo-Grade"
- **Footer**: Support contact, security notice
- **Colors**: Match app theme (indigo, purple, pink gradients)
- **Responsive**: Mobile-friendly

**HTML Structure:**
```html
<table width="100%" cellpadding="0" cellspacing="0">
  <!-- Header with gradient -->
  <tr>
    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      <!-- Logo + Title -->
    </td>
  </tr>
  
  <!-- Welcome Message -->
  <tr>
    <td>
      <h1>Welcome, {name}!</h1>
      <p>Your account has been created on Algo-Grade</p>
    </td>
  </tr>
  
  <!-- Account Details Card -->
  <tr>
    <td style="background: #f8f9fa; padding: 24px; border-radius: 12px">
      <h2>Your Account Details</h2>
      <!-- Details table -->
      <!-- Password box (highlighted) -->
    </td>
  </tr>
  
  <!-- Login Instructions -->
  <tr>
    <td>
      <h2>How to Get Started</h2>
      <ol>
        <li>Visit the login page</li>
        <li>Enter your email and password</li>
        <li>Change your password after first login</li>
      </ol>
    </td>
  </tr>
  
  <!-- CTA Button -->
  <tr>
    <td>
      <a href="{loginUrl}" style="button styles">Login to Algo-Grade</a>
    </td>
  </tr>
  
  <!-- Footer -->
  <tr>
    <td style="color: #666; font-size: 12px">
      <!-- Security notice, contact info -->
    </td>
  </tr>
</table>
```

**Key Features:**
- Inline CSS (for email client compatibility)
- Table-based layout (better email support)
- Fallback fonts
- Dark mode friendly colors
- Accessible contrast

---

### 4. API Route: `/api/admin/email/welcome/route.ts`

**Purpose:** Send welcome email endpoint

**Method:** POST

**Request Body:**
```typescript
{
    to: string (email)
    name: string
    password: string
    role: "admin" | "student"
    rollNo?: string
}
```

**Implementation:**
```typescript
export async function POST(request: Request) {
    try {
        // Verify admin auth
        const { userId } = await auth()
        // ... auth check
        
        const body = await request.json()
        const { to, name, password, role, rollNo } = body
        
        // Validate required fields
        if (!to || !name || !password || !role) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            )
        }
        
        // Send email
        const result = await sendWelcomeEmail({
            to,
            name,
            password,
            role,
            rollNo
        })
        
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Welcome email sent successfully"
            })
        } else {
            return NextResponse.json({
                success: false,
                message: result.error || "Failed to send email"
            }, { status: 500 })
        }
    } catch (error) {
        console.error("Error sending welcome email:", error)
        return NextResponse.json({
            success: false,
            message: "Failed to send email"
        }, { status: 500 })
    }
}
```

---

### 5. UI Component: `/components/admin/send-email-dialog.tsx`

**Purpose:** Dialog shown after user creation offering to send email

**Features:**
- Appears after successful user creation
- Shows user details (name, email, password)
- Checkbox: "Send welcome email with these details?"
- Email preview button (optional)
- Send button with loading state
- Success/error feedback
- Skip option (user can skip email sending)

**State Management:**
```typescript
const [open, setOpen] = useState(false)
const [sendEmail, setSendEmail] = useState(true)
const [sending, setSending] = useState(false)
const [sent, setSent] = useState(false)
const [error, setError] = useState("")
```

**Flow:**
1. User created successfully
2. Dialog opens with message: "User created! Send welcome email?"
3. Shows email details preview
4. Admin clicks "Send Email" or "Skip"
5. If sent: shows success toast
6. If error: shows error message with retry option

**Dialog Content:**
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        <Mail className="h-5 w-5 text-primary" />
        Send Welcome EMAIL
      </DialogTitle>
      <DialogDescription>
        Send account details to {name} at {email}
      </DialogDescription>
    </DialogHeader>
    
    {/* User Details Summary */}
    <div className="space-y-3">
      <div className="rounded-lg border p-3">
        <p className="text-sm"><strong>Name:</strong> {name}</p>
        <p className="text-sm"><strong>Email:</strong> {email}</p>
        <p className="text-sm"><strong>Role:</strong> {role}</p>
        {rollNo && <p className="text-sm"><strong>Roll No:</strong> {rollNo}</p>}
      </div>
      
      {/* Password Display */}
      <div className="rounded-lg border bg-muted p-3">
        <p className="text-xs text-muted-foreground">Temporary Password</p>
        <p className="font-mono text-lg font-bold">{password}</p>
      </div>
    </div>
    
    {/* Email Preview Toggle */}
    <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
      <Eye className="mr-2 h-4 w-4" />
      {showPreview ? "Hide" : "Preview"} Email Template
    </Button>
    
    {showPreview && (
      <div className="rounded-lg border overflow-hidden">
        <iframe srcDoc={emailHTML} className="w-full h-96" />
      </div>
    )}
    
    <DialogFooter>
      <Button variant="outline" onClick={() => onSkip()}>
        Skip Email
      </Button>
      <Button onClick={handleSendEmail} disabled={sending}>
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Welcome EMAIL
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 6. Integration with Create User Dialog

**File:** `/components/admin/create-user-dialog.tsx`

**Changes:**
- After successful user creation, emit `onUserCreated` event with user data
- Parent component catches event and opens `SendEmailDialog`
- Pass user details (name, email, password, role, rollNo) to email dialog

**Updated Flow:**
```typescript
// In CreateUserDialog
const handleSuccess = (userData: {
    name: string
    email: string
    password: string
    role: string
    rollNo?: string
}) => {
    onUserCreated(userData)
}

// In UsersManagementPage
const handleUserCreated = (userData: UserData) => {
    setPendingEmail(userData)
    setEmailDialogOpen(true)
}
```

---

### 7. Update Main Users Page

**File:** `/app/(dashboardAdmin)/admin/users/page.tsx`

**Changes:**
- Add `SendEmailDialog` component
- Add state for pending email data
- Handle user creation callback
- Wire up email sending flow

**New State:**
```typescript
const [pendingEmail, setPendingEmail] = useState<{
    name: string
    email: string
    password: string
    role: string
    rollNo?: string
} | null>(null)
const [emailDialogOpen, setEmailDialogOpen] = useState(false)
```

---

## File Structure

```
src/
├── lib/
│   ├── email.ts                              # NEW - Email service with Resend
│   └── email-templates/
│       └── welcome-email.tsx                 # NEW - HTML email template
├── app/
│   └── api/
│       └── admin/
│           └── email/
│               └── welcome/
│                   └── route.ts              # NEW - Send welcome email API
├── components/
│   └── admin/
│       ├── send-email-dialog.tsx             # NEW - Email sending dialog
│       └── create-user-dialog.tsx            # MODIFIED - Emit user created event
├── app/
│   └── (dashboardAdmin)/
│       └── admin/
│           └── users/
│               └── page.tsx                  # MODIFIED - Add email dialog
└── doc/
    └── WELCOME_EMAIL_RESEND_PLAN.md          # THIS FILE
```

---

## Implementation Steps

### Step 1: Install Resend & Setup
- Install `resend` package
- Add `RESEND_API_KEY` to `.env.local` (you'll need to provide this)
- Create email service utility

### Step 2: Create Email Template
- Build beautiful HTML email template
- Inline CSS for email compatibility
- Responsive design
- Match Algo-Grade branding

### Step 3: Create API Route
- `/api/admin/email/welcome/route.ts`
- Admin authentication required
- Validate inputs
- Call Resend API
- Return success/error

### Step 4: Create Email Dialog Component
- Post-creation dialog
- User details preview
- Email template preview
- Send/Skip options
- Loading & success states

### Step 5: Integrate with User Creation Flow
- Modify create-user-dialog to emit event
- Wire up email dialog in users page
- Handle success/error states
- Toast notifications

### Step 6: Testing
- Test email sending with real Resend API
- Verify email rendering
- Test error handling
- Test skip functionality
- Verify mobile responsiveness

---

## Email Template Design Preview

**Header Section:**
```
╔══════════════════════════════════════╗
║  [Gradient: Indigo → Purple → Pink] ║
║                                      ║
║    ✨ Algo-Grade                     ║
║    Welcome to Your New Account!      ║
╚══════════════════════════════════════╝
```

**Account Details Card:**
```
┌────────────────────────────────────┐
│  Your Account Details              │
├────────────────────────────────────┤
│  Name:     John Doe                │
│  Email:    john@example.com        │
│  Role:     [Student]               │
│  Roll No:  2024CS101               │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Temporary Password          │  │
│  │  abc123A1!  [Copy]           │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Login Instructions:**
```
📋 How to Get Started:
1. Click the button below to visit the login page
2. Enter your email and temporary password
3. Change your password after first login (recommended)
4. Start exploring Algo-Grade!

[🚀 Login to Algo-Grade] (Button)
```

**Footer:**
```
─────────────────────────────────────
🔒 This is a secure message from Algo-Grade
If you didn't expect this email, please contact your administrator.
© 2026 Algo-Grade. Code Together.
```

---

## Resend Setup Instructions

### 1. Get API Key
1. Go to https://resend.com
2. Sign up / Login
3. Go to API Keys section
4. Create new API key
5. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

### 2. Domain Setup (Optional, for production)
1. Add your domain in Resend dashboard
2. Verify DNS records (SPF, DKIM, DMARC)
3. Update `from` address in email service

### 3. Free Tier Limits
- 100 emails/day
- 3,000 emails/month
- Perfect for testing!

---

## Security Considerations

1. **Password in Email**: 
   - Temporary password only
   - User must change on first login (recommended)
   - Email is sent to verified address only

2. **API Route Protection**:
   - Requires admin authentication
   - Rate limiting (future enhancement)
   - Input validation

3. **Email Content**:
   - No sensitive data beyond password
   - Clear security notice in footer
   - Instructions to change password

4. **Error Handling**:
   - Don't expose Resend API errors to client
   - Log errors server-side only
   - Show generic error messages

---

## Email Template Customization

**Colors (matching Algo-Grade theme):**
- Primary gradient: `#667eea → #764ba2 → #f093fb`
- Background: `#ffffff` (light), `#1a1a1a` (dark mode fallback)
- Text: `#1f2937` (primary), `#6b7280` (secondary)
- Accent: `#8b5cf6` (purple)

**Typography:**
- Headings: System fonts (SF Pro, Segoe UI)
- Body: System fonts
- Password: Monospace (Consolas, Monaco)

**Branding:**
- Logo: Sparkle emoji ✨ + "Algo-Grade"
- Tagline: "Code Together"
- Colors match app theme

---

## Future Enhancements (Out of Scope)

1. Email templates for other events:
   - Password reset
   - Role change notification
   - Assignment notifications
   - Grade announcements
2. Email preferences/settings per user
3. Email history/logs
4. Bulk email sending
5. Custom domain for sending
6. Email tracking (opens, clicks)
7. HTML email editor for admins

---

## Questions for Review

1. **Do you have a Resend account, or should I guide you through setup?**
2. **What "from" email address do you want?** (e.g., `noreply@algo-grade.com` or use Resend's default)
3. **Should we add a "Resend Password" email feature later?**
4. **Do you want email preview in the dialog, or just send directly?**
5. **Should we log sent emails in database for audit trail?**

---

**Ready for implementation?** Review this plan and let me know if you'd like any changes before I start building!
