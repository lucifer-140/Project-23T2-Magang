# Project Specification: UPH Lecturer Administration Dashboard

**Version:** 0.6.0  
**Last Updated:** 2026-04-10  
**Status:** Stable - Core Features Complete

---

## 1. Project Overview

The **UPH Lecturer Administration Dashboard** is a comprehensive portal for digitalized academic document management at Universitas Pelita Harapan (UPH). The system facilitates submission, review, and approval of RPS (Semester Learning Plans) through a multi-level approval workflow: Dosen → Koordinator → Kaprodi.

### Key Objectives

- Eliminate manual document handling via digital workflows
- Enforce structured multi-level approval with accountability
- Provide role-specific action-oriented dashboards
- Maintain data integrity through RBAC and audit trails
- Enable real-time document status tracking

---

## 2. System Architecture

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js, Next.js App Router, REST API |
| **Database** | PostgreSQL + Prisma ORM v7 |
| **Authentication** | Cookie-based sessions (custom) |
| **File Storage** | Local filesystem (`/public/uploads/`) |
| **UI** | Lucide Icons, custom components |

---

## 3. Functional Requirements

### 3.1 RPS Management (Core Feature)

#### Multi-Level Approval Workflow

1. **Dosen Submission**: Upload RPS file → appears on Koordinator & Kaprodi dashboards
2. **Koordinator Review**: Approve (move to Kaprodi) or Reject (return to Dosen)
3. **Kaprodi Final Review**: Approve (final) or Reject (reset chain, back to Dosen)

#### Key Fields

- `status`: UNSUBMITTED | SUBMITTED | PENGECEKAN | REVISION | APPROVED
- `isKoordinatorApproved`: Boolean flag for Kaprodi unlock
- `koordinatorId`: User FK (first-level reviewer)
- `koordinatorNotes`: Rejection reason from Koordinator
- `kaprodiNotes`: Rejection reason from Kaprodi

#### UI Elements

**Dosen Page:**
- Upload button (UNSUBMITTED/REVISION)
- Download PDF button (APPROVED only)
- Revision notes with attribution

**Koordinator & Kaprodi Pages (Identical UI):**
- Review queue (status-based filtering)
- Menunggu Revisi tab (with "Ditolak oleh [Koordinator|Kaprodi]" labels)
- Direktori Dosen tab (progress tracking)
- Arsip Terverifikasi tab (completed docs)

**Kaprodi-Specific:**
- Koordinator name column
- Locked review button until `isKoordinatorApproved=true`

---

### 3.2 User Roles & Permissions

| Role | Capabilities | Paths |
|------|--------------|-------|
| **MASTER** | System monitoring, full user management | `/dashboard/master` |
| **ADMIN** | Matkul CRUD, user management | `/dashboard/admin` |
| **KAPRODI** | RPS final review, dosen oversight | `/dashboard/kaprodi` + `/dashboard/dosen` |
| **KOORDINATOR** | RPS first-level review | `/dashboard/koordinator` + `/dashboard/dosen` |
| **DOSEN** | Upload RPS, track status | `/dashboard/dosen` |

---

### 3.3 Matkul Management

- CRUD operations (Admin)
- Assign multiple dosens
- Assign multiple koordinators
- Course code unique constraint

---

### 3.4 User Management

- Create, update, delete users (except MASTER hidden from non-MASTER)
- Assign multiple roles
- Master: Full CRUD including other MASTER accounts

---

### 3.5 Change Requests

- Admin proposes course modifications
- Pending → Approved/Rejected workflow
- Changes apply to matkul record

---

## 4. Non-Functional Requirements

### Performance

- API response: < 200ms
- Support 100+ concurrent users
- File limit: 10 MB
- Database indexes on status, dosenId, matkulId

### Security

- Cookie-based sessions (HTTP-only)
- RBAC at route and API level
- File type validation (PDF, DOC, DOCX)
- Input validation on all endpoints

### Reliability

- Database backups enabled
- Transaction handling
- Graceful error degradation

### Usability

- Indonesian UI throughout
- Action-oriented tab design
- Clear status badges
- Minimal clicks to common actions

---

## 5. Database Schema

### Core Models

```
User:
  ├── id (PK)
  ├── email (unique)
  ├── password
  ├── roles[] (enum array)
  ├── rps[] (1:M — Dosen submissions)
  └── koordinatorReviews[] (1:M)

Matkul:
  ├── id (PK)
  ├── code (unique)
  ├── name, sks
  ├── dosens[] (M:M)
  ├── koordinators[] (M:M)
  └── rps[] (1:M)

RPS:
  ├── id (PK)
  ├── matkulId, dosenId (FK)
  ├── status (enum)
  ├── isKoordinatorApproved (Boolean)
  ├── koordinatorId (FK, nullable)
  ├── fileName, fileUrl
  ├── koordinatorNotes, kaprodiNotes
  └── timestamps

Enums:
  ├── Role: MASTER, ADMIN, KAPRODI, KOORDINATOR, DOSEN
  ├── RpsStatus: UNSUBMITTED, SUBMITTED, PENGECEKAN, REVISION, APPROVED
  └── ChangeRequestStatus: PENDING, APPROVED, REJECTED
```

---

## 6. API Endpoints

### RPS

```
POST /api/rps/upload
  Body: { file, matkulId, dosenId, rpsId? }
  Response: RPS object with status, isKoordinatorApproved

PATCH /api/rps/[id]/review
  Body: { reviewer: 'koordinator'|'kaprodi', action: 'approve'|'reject', notes? }
  Response: Updated RPS with new status and notes
```

### Matkul

```
GET/POST /api/matkul
GET/PATCH/DELETE /api/matkul/[id]
POST /api/matkul/[id]/assign
POST /api/matkul/[id]/assign-coordinator
```

### Users

```
GET/POST /api/users
GET/PATCH/DELETE /api/users/[id]
```

---

## 7. User Workflows

### Dosen
1. Upload RPS
2. Monitor approval status
3. If rejected, review notes and re-upload
4. Download when APPROVED

### Koordinator
1. View review queue (SUBMITTED, no coordinator approval)
2. Download and review file
3. Approve → Kaprodi queue OR Reject → Dosen with notes
4. Monitor revisions and progress

### Kaprodi
1. View review queue (SUBMITTED with coordinator approval only)
2. See Koordinator name for accountability
3. Review locked until coordinator approves
4. Approve (final) or Reject (reset chain)

### Admin
1. Create/manage users
2. Manage matkul CRUD
3. Assign dosens and koordinators
4. Approve/reject change requests

### Master
1. Full user account management
2. System health monitoring
3. View application logs

---

## 8. Testing

### Manual Checklist

- [x] Dosen upload → visible to both Koordinator & Kaprodi
- [x] Koordinator approve → Kaprodi button enabled
- [x] Kaprodi approve → status APPROVED, download enabled
- [x] Rejection shows reviewer attribution
- [x] Re-upload resets approval chain
- [x] All role permissions enforced

---

## 9. Deployment

### Development

```bash
docker compose up -d
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| master@test.com | master123 | MASTER |
| admin@test.com | admin123 | ADMIN |
| kaprodi@test.com | kaprodi123 | KAPRODI |
| koordinator@test.com | koordinator123 | KOORDINATOR |
| dosen@test.com | dosen123 | DOSEN |

---

## 10. Roadmap

### Phase 4: SOAL Verification (Exam Questions)
### Phase 5: LPP Verification (Learning Outcomes)
### Phase 6: EPP Verification (Student Portfolio)
### Phase 7: Berita Acara Perwalian (Advising Notes)

---

## 11. Success Criteria

✓ Multi-level RPS approval fully functional
✓ Koordinator & Kaprodi dashboards with identical UI
✓ Sequential approval enforced (Koordinator → Kaprodi)
✓ Rejection attribution captured and displayed
✓ Download PDF for approved RPS
✓ All documentation comprehensive
✓ Git history clean with conventional commits
✓ Zero emojis in production UI

---

## 12. Version History

| Version | Date | Status | Features |
|---------|------|--------|----------|
| 0.6.0 | 2026-04-10 | Stable | Multi-level approval, Koordinator page |
| 0.5.0 | 2026-02-15 | Stable | Core dashboards, single-stage review |
| 0.1.0 | 2025-12-01 | Archived | Initial setup |

---

**Owner:** Development Team  
**Last Updated:** 2026-04-10
