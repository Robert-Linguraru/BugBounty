# SECURITY.md — Threat Model & Security Implementation Document

## 1. Overview & Operational Threat Model

The **BugBounty Platform** processes two primary classifications of sensitive asset data:
1. **Private User Data & Un-disclosed Reports (F5):** Vulnerability details, target asset names, internal severity assessments, monetary bounty allocations, and researcher personal data (emails, payout tracking).
2. **User-Generated Content & Public Advisories (F6):** Disclosed vulnerability summaries, public comments, and technical write-ups read by other researchers.

### Threat Actors & Risk Profile
* **Automated AI Exploitation Agents:** The main threat vector consists of AI agents that bypass the React client UI and send automated, mutated HTTP requests directly to backend REST endpoints.
* **Malicious Researchers:** Authenticated standard users attempting to read or tamper with vulnerability disclosures owned by other researchers, or escalate privileges to gain administrative capabilities.

---

## 2. Baseline Protections & Implementation Matrix

| Threat Class / Requirement | Defense Mechanism | Implementation Details & Source Location |
| :--- | :--- | :--- |
| **F1: Password Security & Session Safety** | Slow algorithm password hashing & secure cookie flags. | Passwords hashed using `bcrypt` (12 salt rounds) in `src/controllers/authController.js`. Sessions issued via `HttpOnly`, `SameSite=Strict` cookies containing signed JWTs to prevent XSS cookie theft. |
| **F2: Privilege Escalation** | Server-side role checks & payload stripping. | Admin routes enforce `requireRole('ADMIN')` middleware in `src/middleware/auth.js`. Public registration schemas (`Zod`) strip un-mapped `role` fields, ensuring all new signups default to `RESEARCHER`. |
| **F4 / F5: IDOR / Broken Access Control** | Explicit server-side ownership verification. | Every endpoint retrieving or updating reports verifies `report.userId === req.user.id \|\| req.user.role === 'ADMIN'` in `src/controllers/reportController.js`. Direct parameter querying without ownership checks is strictly prohibited. |
| **F6: Stored & Reflected XSS** | Server-side HTML sanitization & output escaping. | All user-submitted Markdown, descriptions, and comments pass through `sanitize-html` in `src/utils/sanitizer.js` before PostgreSQL persistence. React automatically escapes text content on output. |
| **F7: SQL / NoSQL Injection** | Parameterized queries via ORM. | All database interactions rely exclusively on **Prisma ORM** query builders in `src/models/`. No raw SQL strings or un-parameterized queries exist in the codebase. |
| **F8: Arbitrary File Upload & Path Traversal** | Extension whitelisting, UUID renaming, & MIME inspection. | File uploads handled via `Multer` in `src/middleware/upload.js`. Files are limited to 5 MB, restricted to `.png`, `.jpg`, `.pdf`, `.txt`, stripped of original names, renamed to random UUIDs, and stored outside web root. |

---

## 3. Server-Side Security Guard Code Examples

### IDOR Isolation Guard (`src/middleware/authorizeOwner.js`)
```javascript
// Enforces that users can only access or modify their own data
export const verifyReportOwnership = async (req, res, next) => {
  const { id } = req.params;
  const report = await prisma.report.findUnique({ where: { id } });

  if (!report) {
    return res.status(404).json({ success: false, error: "Report not found" });
  }

  if (report.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: "Access denied: Unauthorized access to report" });
  }

  req.report = report;
  next();
};

```

### Stored XSS Mitigation (`src/utils/sanitizer.js`)

```javascript
import sanitizeHtml from 'sanitize-html';

export const sanitizeUGC = (dirtyInput) => {
  return sanitizeHtml(dirtyInput, {
    allowedTags: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'ul', 'li'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

```

---

## 4. Automated Access Control Test Matrix

The test suite located in `tests/accessControl.test.js` uses **Jest** and **Supertest** to explicitly test access control enforcement:

1. **Test 1 (`GET /api/reports/:id` - IDOR Defense):** Asserts that `Researcher B` receives a `403 Forbidden` HTTP status when requesting the UUID of an un-disclosed report owned by `Researcher A`.


2. **Test 2 (`PUT /api/reports/:id` - Unauthorized Mutation Defense):** Asserts that `Researcher B` receives a `403 Forbidden` HTTP status when attempting to edit `Researcher A`'s report.


3. **Test 3 (`PATCH /api/admin/reports/:id/triage` - Privilege Escalation Defense):** Asserts that a user with the `RESEARCHER` role receives a `403 Forbidden` HTTP status when calling administrative triage endpoints.

```