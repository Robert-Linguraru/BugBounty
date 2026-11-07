# GitHub Project Board Guide: BugBounty

This document is formatted explicitly for a GitHub Project (Kanban-style) setup. It is divided into **4 Sprints** and **7 Major Epics**

---

## Sprint 1: Foundation & Authentication

**Goal:** Stand up the architecture, database, and secure login system.

### Epic 1: Project Foundation & Database Setup

* **[Task 1.1] Initialize Docker & Environments**
* Set up `docker-compose.yml` with `postgres`, `backend`, and `frontend` containers.
* Configure persistent volumes (`postgres_data`, `uploads_data`).
* Create `.env.example` with placeholder secrets.


* **[Task 1.2] Prisma ORM Schema**
* Define `User`, `Report`, `Attachment`, and `Comment` models in `schema.prisma`.
* Run initial database migrations (`npx prisma migrate dev`).


* **[Task 1.3] Database Seed Script**
* Write `prisma/seed.js` to generate 2 Admins, 2 Researchers, and 20+ total records.
* Ensure seeded passwords are hashed using `bcrypt`.




 
### Epic 2: Secure Authentication Engine

* **[Task 2.1] Register & Login API**
* Build `POST /api/auth/register` (hash passwords, default to `RESEARCHER` role).
* Build `POST /api/auth/login` (issue JWTs inside `HttpOnly`, `SameSite=Strict` cookies).


* **[Task 2.2] Role Middleware**
* Build Express middleware to verify JWTs and enforce `requireRole('ADMIN')` rules.


* **[Task 2.3] Frontend Auth Views**
* Build React `Login.jsx` and `Register.jsx` pages.
* Handle HTTP cookie responses and store local user state (e.g., React Context).





---

## Sprint 2: Core Vulnerability Workflows

**Goal:** Enable researchers to submit and manage reports securely, strictly preventing IDOR exploits.

### Epic 3: Report CRUD & IDOR Defense

* **[Task 3.1] Report Creation & Fetching API**
* Build `POST /api/reports` (validate fields using Zod).
* Build `GET /api/reports` (filter query so researchers only receive their own reports).


* **[Task 3.2] Report IDOR Guards**
* Build `GET`, `PUT`, `DELETE` for `/api/reports/:id`.
* Implement explicit ownership verification (`report.userId === req.user.id || admin`) to prevent IDOR.


* **[Task 3.3] Researcher Dashboard UI**
* Build React `Dashboard.jsx` to list the user's submitted reports and earned bounties.


* **[Task 3.4] Submit & Edit Report Forms**
* Build React `SubmitReport.jsx` form (with client-side validation as a UX layer on top of the server checks).





---

## Sprint 3: File Uploads, UGC & Admin Controls

**Goal:** Handle dangerous inputs safely (files and text) and build the admin management tools.

### Epic 4: File Uploads & UGC Sanitization

* **[Task 4.1] Secure File Upload Pipeline**
* Build `POST /api/reports/:id/attachments` using `Multer`.
* Restrict to 5MB, validate extensions (`.png`, `.pdf`), and rename files to UUIDs to prevent path traversal.


* **[Task 4.2] UGC Commenting & Sanitization**
* Build `POST /api/reports/:id/comments`.
* Process input body through `sanitize-html` before saving to prevent Stored XSS.


* **[Task 4.3] Frontend Report Detail View**
* Build `ReportDetail.jsx` showing report data, a file upload dropzone, and the comment thread.





### Epic 5: Admin Triage & Moderation

* **[Task 5.1] Admin API Routes**
* Build `PATCH /api/admin/reports/:id/triage` protected by admin middleware.
* Allow admins to update status, severity, bounty, and disclosure state.


* **[Task 5.2] Admin Panel UI**
* Build React `AdminPanel.jsx` containing a data table of all system reports.
* Add UI controls to assign bounties and triage status.





---

## Sprint 4: Search, Testing, & Launch

**Goal:** Wrap up public views, write the required tests, and finalize grading deliverables.

### Epic 6: Public Advisories & Search

* **[Task 6.1] Search & Filter API**
* Build `GET /api/advisories` using Prisma parameterized queries to prevent SQL Injection.
* Support keyword search and severity filtering.


* **[Task 6.2] Advisory Board UI**
* Build React `Advisories.jsx` public feed displaying disclosed vulnerabilities.





### Epic 7: QA & Final Deliverables

* **[Task 7.1] Security Test Suite**
* Write tests for Authentication, SQLi resistance, and basic CRUD.
* Write the **3 required access control tests** (e.g., verifying `403 Forbidden` on unauthorized report access) and upload tests.


* **[Task 7.2] Documentation & Repository Polish**
* Confirm `README.md` and `SECURITY.md` are up to date in the root directory.
* Verify clean `.env.example` (no real secrets committed).