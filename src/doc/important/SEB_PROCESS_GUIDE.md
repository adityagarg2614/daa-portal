# Safe Exam Browser (SEB) Process Guide

This guide provides the **exact step-by-step workflow** to set up, secure, and run proctored exams on your portal.

---

## Part 1: Initial Setup (One-time)
1. **Open SEB Preferences on your Mac**:
   - Hold `Option` while launching SEB.
2. **Configure Settings**:
   - **General Tab**: Set Start URL to `http://localhost:3000` (or your live domain).
   - **General Tab**: Set a **Quit Password**.
   - **Exams Tab**: Check **"Use Browser & Config Keys"**.
3. **Generate your Key**:
   - Go to `File -> Save As...` and save as `exam.seb`.
   - Go to **Exams Tab** and copy the long **Config Key** hash.

---

## Part 2: Secure an Assignment
1. **Login as Admin** on your portal.
2. Go to **Assignments -> Create** (or Edit an existing one).
3. Toggle **"Safe Exam Browser Required"** to **ON**.
4. **Paste the Config Key** you copied from Part 1.
5. **Save** the assignment.

---

## Part 3: Student Launch Flow
1. **Student logs in** using a normal browser (Chrome/Safari).
2. Student navigates to the assignment page.
3. They will see a **"Locked" screen** because they aren't in SEB yet.
4. Student clicks **"Start Exam"** -> This takes them to a pre-launch page.
5. Student clicks **"Launch in Safe Exam Browser"**.
   - Your Mac will ask for permission to open SEB. Click **Allow**.
6. SEB will launch and automatically load your portal at the protected URL.

---

## Part 4: Verification (How do I know it's working?)
- **Direct Link Test**: Try opening the assignment URL (e.g., `http://localhost:3000/assignment/123`) in Chrome. 
  - **Result**: You should see a "Locked" message. Access is **DENIED**.
- **SEB Test**: Open the assignment via the `.seb` file or the "Launch" button.
  - **Result**: You should see the code editor and questions. Access is **GRANTED**.
- **Submission Test**: Submit the assignment inside SEB.
  - **Result**: You are redirected to `/exam/finished` showing your score.
- **Exit Test**: Click "Exit Secure Environment" on the finished page.
  - **Result**: SEB asks for the **Quit Password** you set in Part 1.

---

## Troubleshooting
- **"Config Key Mismatch"**: If you change *any* setting in the SEB Preferences, you **must** save a new `.seb` file and update the **Config Key** in the Admin dashboard. The key is a fingerprint of your exact settings.
- **Localhost issues**: If SEB blocks `localhost`, you can disable certificate checks in the **Network** tab of the SEB Preferences.
