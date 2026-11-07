# ARCHITECTURE.md: BugBounty Platform Architecture & Specification

## 1. System Overview & Core Objective

**BugBounty** is a containerized web application designed for security researchers to submit vulnerability reports, track triage status, upload proof-of-concept (PoC) files, and participate in public vulnerability advisories. Admins triage reports, set severity levels, manage monetary bounty payouts, and moderate disclosures.

The application is built to achieve a **0-exploit score against automated AI red-team agents**. The primary security objective is complete server-side isolation of private data, strict role-based access control, parameterized database access, and secure file handling.

---

## 2. Technical Stack & Architectural Decisions

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Docker Compose                      │
                               │                                                        │
┌────────────────────────┐     │  ┌──────────────────────────────────────────────────┐  │
│  AI Red-Team Agents    │──┐  │  │        React Frontend Container (Vite)         │  │
└────────────────────────┘  │  │  └─────────────────────────┬────────────────────────┘  │
                            │  │                            │ HTTP / API                │
                            │  │                            ▼                           │
┌────────────────────────┐  │  │  ┌──────────────────────────────────────────────────┐  │
│   Human Web Browser    │──┴──┼─>│          Express.js Backend Container           │  │
└────────────────────────┘     │  └──────────┬──────────────────────────┬────────────┘  │
                               │             │ Prisma ORM               │ File I/O      │
                               │             ▼                          ▼               │
                               │  ┌─────────────────────┐    ┌───────────────────────┐  │
                               │  │ PostgreSQL Container│    │ Shared Storage Volume │  │
                               │  │  (postgres_data)    │    │    (uploads_data)     │  │
                               │  └─────────────────────┘    └───────────────────────┘  │
                               └────────────────────────────────────────────────────────┘

```

* **Frontend:** React (JSX) initialized via Vite. Communicates with the backend exclusively via standard HTTP JSON endpoints.


* **Backend:** Node.js + Express.js. Hosts all routing, input validation, authentication guards, and database ORM queries.


* **Database:** Containerized PostgreSQL 15. Managed through **Prisma ORM** for schema migrations and parameterized querying.


* **Session & Authentication:** Local stateless JSON Web Tokens (JWT) stored inside `HttpOnly`, `SameSite=Strict` HTTP cookies. Passwords hashed using `bcrypt` (12 salt rounds).


* **File Upload Pipeline:** `Multer` middleware enforcing file size limits (5 MB max), extension whitelist, MIME magic-number checking, and random UUID storage filenames.


* **Input Validation & Sanitization:** `Zod` schemas for strict request body parsing and `sanitize-html` for server-side stripping of malicious tags in user-generated content.


* **Automated Testing Engine:** Jest + Supertest executing HTTP integration tests against a dedicated database context.


* **Infrastructure:** Single `docker-compose.yml` orchestrating three distinct containers (`frontend`, `backend`, `db`) and two persistent volumes.



---

## 3. Database Schema (Prisma Blueprint)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  RESEARCHER
  ADMIN
}

enum Status {
  PENDING
  TRIAGED
  RESOLVED
  REJECTED
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  username     String      @unique
  passwordHash String
  role         Role        @default(RESEARCHER)
  createdAt    DateTime    @default(now())
  
  reports      Report[]
  comments     Comment[]
}

model Report {
  id           String       @id @default(uuid())
  userId       String
  title        String
  targetSystem String
  severity     Severity     @default(LOW)
  status       Status       @default(PENDING)
  bountyAmount Decimal      @default(0.00) @db.Decimal(10, 2)
  details      String       // Private data (F5)
  isDisclosed  Boolean      @default(false)
  createdAt    DateTime     @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  attachments  Attachment[]
  comments     Comment[]
}

model Attachment {
  id           String   @id @default(uuid())
  reportId     String
  originalName String
  storedName   String   // Saved on disk as UUID.ext
  mimeType     String
  sizeBytes    Int
  createdAt    DateTime @default(now())

  report       Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(uuid())
  reportId  String
  userId    String
  content   String   // UGC (F6) sanitized via server
  createdAt DateTime @default(now())

  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

```

---

## 4. Requirement & Verification Mapping Matrix

| Requirement | Implementation Details | Target Vulnerability Defended |
| --- | --- | --- |
| **F1: User Accounts**

 | Local registration and login via Express using `bcrypt` (12 rounds). JWT stored in `HttpOnly` cookies.

 | Brute-force, weak sessions, token theft via XSS.

 |
| **F2: 2 Roles**

 | `RESEARCHER` and `ADMIN`. Role checked on server routes. Admin role assignment restricted from public API payload.

 | Vertical privilege escalation, role tampering.

 |
| **F3: 3 Related Entities**

 | `User` $\rightarrow$ `Report` $\rightarrow$ `Attachment` $\rightarrow$ `Comment` with foreign keys.

 | Data model integrity corruption.

 |
| **F4: Full CRUD on 2 Entities**

 | Full CRUD operations for `Report` and `Comment` with explicit ownership checks.

 | IDOR / BOLA (Insecure Direct Object Reference).

 |
| **F5: Private Data per User**

 | Un-disclosed report details, internal severity ratings, and financial payouts.

 | Broken access control, unauthorized data exposure.

 |
| **F6: Shared UGC**

 | Disclosed advisory comments and write-ups sanitized using `sanitize-html`.

 | Stored and Reflected XSS.

 |
| **F7: Search / Filter**

 | Filter disclosures by severity tag, status, or search query using Prisma parameterized queries.

 | SQL Injection (SQLi).

 |
| **F8: File Uploads**

 | `Multer` validation (max 5 MB, extensions: `.png`, `.jpg`, `.pdf`, `.txt`), UUID renaming.

 | Arbitrary file execution, path traversal (`../../`).

 |

---

## 5. Endpoints & Response Contracts

### API Standard Envelope

* **Success (200 / 201):** `{ "success": true, "data": { ... } }`
* **Error (400 / 401 / 403 / 404 / 500):** `{ "success": false, "error": "Human readable message" }`

### Complete Endpoint Directory

| Method | Endpoint | Authorization Required | Server-Side Defenses Enforced |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Hashes password with bcrypt; forces role to `RESEARCHER`.

 |
| `POST` | `/api/auth/login` | Public | Validates credentials; sets `HttpOnly` JWT cookie.

 |
| `POST` | `/api/auth/logout` | Public | Clears authorization cookie.

 |
| `GET` | `/api/reports` | Authenticated | Filters records: Researchers receive **only their reports**; Admins receive all.

 |
| `POST` | `/api/reports` | Authenticated | Validates fields using Zod; attaches `userId` from active session.

 |
| `GET` | `/api/reports/:id` | Authenticated | Enforces ownership check (`report.userId === req.user.id |
| `PUT` | `/api/reports/:id` | Authenticated | Enforces ownership check; prevents modification of triaged reports.

 |
| `DELETE` | `/api/reports/:id` | Authenticated | Enforces ownership check; restricts deletion to pending reports.

 |
| `POST` | `/api/reports/:id/attachments` | Authenticated | Ownership check; Multer size/type validation; renames to UUID.

 |
| `POST` | `/api/reports/:id/comments` | Authenticated | Checks viewing rights; sanitizes content body using `sanitize-html`.

 |
| `GET` | `/api/advisories` | Public / Auth | Queries PostgreSQL using Prisma parameterized filters (`isDisclosed: true`).

 |
| `PATCH` | `/api/admin/reports/:id/triage` | Admin Only | Enforces admin middleware check (`req.user.role === 'ADMIN'`).

 |

---

## 6. Security Defense Protocols

```
[ Incoming Request ]
         │
         ▼
[ 1. Authentication Middleware ] ──► (Validates JWT cookie; sets req.user)
         │
         ▼
[ 2. Role Middleware ]           ──► (Verifies required role, e.g., ADMIN)
         │
         ▼
[ 3. Zod Input Validator ]       ──► (Strips unmapped fields; checks types/ranges)
         │
         ▼
[ 4. Database Ownership Guard ]  ──► (Verifies record ownership before update/read)
         │
         ▼
[ 5. Sanitizer / File Check ]    ──► (Sanitizes UGC string or validates upload buffer)
         │
         ▼
[ Database / Disk Action ]

```

### 1. IDOR Isolation Guard (F4/F5)

All resource access must evaluate record ownership server-side:

```javascript
const report = await prisma.report.findUnique({ where: { id: req.params.id } });
if (!report) return res.status(404).json({ success: false, error: "Report not found" });

if (report.userId !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ success: false, error: "Access denied" });
}

```

### 2. UGC Sanitization Guard (F6)

All text fields accepting user-generated content must be sanitized before database insertion:

```javascript
import sanitizeHtml from 'sanitize-html';

const sanitizedContent = sanitizeHtml(req.body.content, {
  allowedTags: ['b', 'i', 'em', 'strong', 'code', 'pre'],
  allowedAttributes: {}
});

```

### 3. File Upload Safety (F8)

Files uploaded via `Multer` must be stripped of original path info and saved as UUIDs within a mounted volume directory:

```javascript
const storage = multer.diskStorage({
  destination: '/app/uploads',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

```

---

## 7. Infrastructure Architecture (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: bugbounty_db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: bugbounty_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    volumes:
      - uploads_data:/app/uploads

  frontend:
    build: ./frontend
    container_name: bugbounty_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:

```

---

## 8. Test Suite Blueprint (Jest + Supertest)

The test suite consists of 10 automated integration tests:

1. `POST /api/auth/register` — Successfully creates user with bcrypt password hash.


2. `POST /api/auth/login` — Issues HttpOnly JWT cookie on valid credentials.


3. `GET /api/reports` — Rejects unauthenticated request with 401 Unauthorized.


4. **[ACCESS CONTROL]** `GET /api/reports/:id` — User A receives 403 Forbidden attempting to read User B's report.


5. **[ACCESS CONTROL]** `PUT /api/reports/:id` — User A receives 403 Forbidden attempting to edit User B's report.


6. **[ACCESS CONTROL]** `PATCH /api/admin/reports/:id/triage` — Non-admin user receives 403 Forbidden.


7. `POST /api/reports/:id/attachments` — Uploading an invalid file extension (`.exe`) returns 400 Bad Request.


8. `POST /api/reports/:id/comments` — Strips malicious `<script>` tags from body prior to database storage.


9. `GET /api/advisories?q=...` — Parameterized query safely processes SQL injection strings (`' OR 1=1 --`).


10. `PATCH /api/admin/reports/:id/triage` — Admin user successfully triages report and updates status/bounty.