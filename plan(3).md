# StudySathi — Product & Engineering Plan

**Document type:** Product requirements + implementation plan  
**Status:** Proposed MVP blueprint  
**Primary use case:** A tutor creates and publishes learning materials for a Class 8 student, who studies on a phone, completes quizzes/homework, and submits doubts.  
**Initial users:** One admin/tutor and one student; architecture should support multiple students later.

---

## 1. Product vision

Build a calm, mobile-first personal tuition platform—not a generic course marketplace. The tutor should be able to create notes, upload PDFs, prepare question banks, generate draft questions with AI, review them, publish quizzes, assign homework, and answer student doubts. The student should be able to study from a phone with minimal friction.

### Product principles
1. **Mobile-first for the student; desktop-efficient for the tutor.**
2. **Learning clarity over decoration.**
3. **AI assists; the tutor remains the publisher and subject-matter reviewer.**
4. **Every learning item belongs to a subject and chapter.**
5. **Measure understanding, not just activity.**
6. **Secure student data and keep private content private.**
7. **Start with a focused MVP; avoid premature infrastructure.**

## 2. Users and roles

### Tutor/Admin
- Manage subjects and chapters.
- Create, edit, preview, publish, archive, and delete notes.
- Upload PDFs and images.
- Create and manage questions.
- Generate draft questions from settings or supplied notes/PDF text.
- Review and correct AI output before publishing.
- Build quizzes from approved questions.
- Assign homework and review submissions.
- Answer student doubts.
- Review quiz history and topic-level progress.
- Manage student account and platform settings.

### Student
- Sign in securely.
- View today's tasks and recent activity.
- Browse subjects, chapters, notes, and PDFs.
- Take available quizzes.
- View results, worked explanations, and past attempts.
- Submit doubts as text and/or images.
- View teacher responses.
- View and submit homework.
- Bookmark notes/questions.
- Review mistakes and mark revision items complete.
- View personal progress and notifications.

### Future roles (not MVP)
- Parent/guardian read-only view.
- Additional tutors with scoped access.
- Multiple classes/grades and cohorts.

## 3. MVP scope

### P0 — Must have
1. Authentication and role-based authorization.
2. Admin and student dashboards.
3. Subject/chapter management.
4. Notes editor and PDF/image upload.
5. Draft/published content states.
6. Question bank with MCQ and numerical-answer support.
7. Manual quiz builder.
8. Quiz attempts, server-side scoring, results, and explanations.
9. Doubt submission with optional image attachment.
10. Admin doubt response workflow.
11. Homework assignment and student submission (text/image).
12. Basic progress overview.
13. Responsive mobile UI and accessibility basics.
14. Input validation, upload validation, rate limits, error handling, and audit-friendly timestamps.

### P1 — High value after MVP is stable
- AI question generation from a form.
- AI question generation from tutor notes/PDF-extracted text.
- AI-generated explanations as editable drafts.
- Bulk approve/reject and regenerate selected questions.
- Mistake notebook and bookmarks.
- In-app notifications.
- Daily/weekly study tasks.
- Chapter-wise analytics and revision suggestions.
- PWA installation and selected offline reading.
- CSV export of quiz results/question bank.

### P2 — Later
- AI hint assistant with safe, age-appropriate tutoring.
- Adaptive practice and spaced revision.
- Parent view.
- Additional tutors/classes.
- Expo app if actual usage justifies it.
- Push notifications, subject to browser/platform support.
- More question types (multi-select, true/false, matching, image-based).
- Timed mock tests and question randomization.

**Do not build initially:** payments, public student registration, social feed, chat system, microservices, RabbitMQ, Redis, or a separate native app. They add complexity without being necessary for one tutor and one student.

## 4. Recommended technical architecture

### Frontend
- React.js + Vite
- JavaScript (not TypeScript, unless the project requirements change)
- Tailwind CSS
- Selectively chosen shadcn/ui components; customize rather than use a default template
- React Router
- Axios or a small typed-by-convention API layer
- React Hook Form + Zod for forms
- KaTeX for mathematical notation
- Lucide React icons
- Optional PWA support after core flows work

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT-based authentication in secure, httpOnly cookies where deployment allows; CSRF protection if cookie-auth is used cross-site. If using bearer tokens instead, keep short-lived access tokens and a deliberate refresh-token strategy.
- Server-side role and resource authorization on every protected route
- Zod or express-validator for request validation
- Multer or equivalent upload middleware with file size/type restrictions
- Cloudinary or private object storage for files; do not store large file binaries directly in MongoDB
- AI provider accessed only from the backend (e.g. OpenRouter or another configured provider)
- Structured logging and centralized error handling

### Deployment
- Frontend: Vercel or equivalent
- Backend: Render or equivalent
- Database: MongoDB Atlas or equivalent
- File storage: Cloudinary/private object storage
- Keep API keys and database credentials in server environment variables.
- Configure CORS to exact deployed origins; never use unrestricted production CORS.

### Architecture shape
```text
React Web (Tutor/Admin + Student)
              |
          HTTPS REST API
              |
       Express application
       |       |        |
      Auth   Learning  AI service
       |       |        |
       +-------+--------+
               |
       MongoDB + File Storage

Future: Expo app consumes the same REST API.
```

Use a modular monolith initially. Separate modules internally, not separate deployable services.

## 5. Information architecture and routes

### Public/auth
- `/login`
- `/forgot-password` (optional for first deployment; admin-managed reset is acceptable for private pilot)

### Student
- `/app`
- `/app/subjects`
- `/app/subjects/:subjectId`
- `/app/chapters/:chapterId`
- `/app/notes/:noteId`
- `/app/quizzes`
- `/app/quizzes/:quizId`
- `/app/quiz-attempts/:attemptId/result`
- `/app/homework`
- `/app/homework/:assignmentId`
- `/app/doubts`
- `/app/doubts/new`
- `/app/doubts/:doubtId`
- `/app/revision`
- `/app/bookmarks`
- `/app/progress`
- `/app/notifications`
- `/app/profile`

### Admin
- `/admin`
- `/admin/subjects`
- `/admin/chapters`
- `/admin/notes`
- `/admin/notes/new`
- `/admin/notes/:noteId/edit`
- `/admin/questions`
- `/admin/questions/new`
- `/admin/ai-question-generator`
- `/admin/quizzes`
- `/admin/quizzes/new`
- `/admin/quizzes/:quizId/edit`
- `/admin/assignments`
- `/admin/submissions`
- `/admin/doubts`
- `/admin/students`
- `/admin/analytics`
- `/admin/settings`

Protect routes in the UI for usability, but always enforce authorization in the API. Hiding a route is not security.

## 6. Core workflows

### A. Publish notes
1. Admin chooses subject and chapter.
2. Admin writes notes in a rich-text editor or uploads a PDF/image.
3. Add title, summary, tags, and optional estimated reading time.
4. Preview on desktop and mobile widths.
5. Save as draft or publish.
6. Student sees only published content.

### B. Create a question manually
1. Select subject, chapter, difficulty, question type, marks.
2. Enter prompt and optional image/equation.
3. Add options and correct answer (for MCQ).
4. Add worked solution/explanation.
5. Validate that the question has a valid answer.
6. Save draft, preview, approve, and add to a quiz.

### C. AI question generation
1. Select subject, grade, chapter, difficulty distribution, question type, count, language, marks, and whether explanations are requested.
2. Optional source: select existing notes or upload a PDF.
3. Extract text from supported PDFs; show extracted text preview and extraction warnings.
4. Send only necessary content to the AI provider from the server.
5. Request schema-constrained structured output.
6. Validate schema, question count, option count, answer references, and required explanations.
7. Run deterministic checks where feasible (e.g. arithmetic/answer consistency); do not claim these prove all answers correct.
8. Detect likely duplicates against the selected batch and existing bank.
9. Save results as **AI drafts**, never auto-publish.
10. Show a review queue with edit, regenerate one, reject, approve, and bulk actions.
11. On approval, save as reusable questions in the question bank.
12. Tutor builds/publishes a quiz from approved questions.

AI-generated content must be treated as unverified until reviewed. Show an “AI draft — review required” label. Do not send student personal data to the model. Add timeouts, retry limits, per-user rate limits, token/cost caps, and useful error states.

### D. Take a quiz
1. Student opens a published quiz during its availability window.
2. Server creates an attempt and returns questions without correct answers or private explanations.
3. Student answers and can navigate questions.
4. Server validates submission and calculates score; never trust a client-provided score.
5. Results reveal correct answers and explanations according to quiz settings.
6. Store attempt, answer history, time, score, and timestamps.
7. Prevent duplicate or conflicting submissions with idempotency/attempt state checks.

### E. Submit a doubt
1. Student selects subject/chapter and enters question.
2. Optional image attachment is validated and uploaded.
3. Doubt is created as `pending`.
4. Admin sees it in the queue and writes a step-by-step answer; optionally attaches a solution image.
5. Admin publishes the answer.
6. Student sees the answer and a notification.

### F. Homework
1. Admin creates assignment, questions/instructions, due date, and attachment.
2. Student submits text and/or images before/after due date according to assignment settings.
3. Admin reviews, scores, and leaves feedback.
4. Student sees submission status and feedback.

## 7. Data model outline

Use Mongoose schemas with timestamps, indexes, ownership fields, and validation. This is a logical outline; finalize exact schema details during implementation.

### `User`
- `name`
- `email` (unique, normalized)
- `passwordHash`
- `role`: `admin | student`
- `isActive`
- `createdAt`, `updatedAt`, `lastLoginAt`

Keep public registration disabled for the private pilot. Create the student account through admin tooling or a secure seed script.

### `Subject`
- `name`
- `slug`
- `grade`
- `sortOrder`
- `isActive`

### `Chapter`
- `subjectId`
- `title`
- `description`
- `sortOrder`
- `isPublished`

### `Note`
- `subjectId`, `chapterId`, `createdBy`
- `title`, `summary`, `contentHtml` or structured editor JSON
- `attachments[]` (storage key, MIME type, size, display name)
- `tags[]`
- `status`: `draft | published | archived`
- `publishedAt`

Sanitize HTML before rendering to prevent stored XSS.

### `Question`
- `subjectId`, `chapterId`, `createdBy`
- `type`: `single_select | numerical | true_false` initially
- `prompt` (rich text/Math notation)
- `options[]` for selectable questions
- `correctAnswer` stored privately
- `explanation`
- `difficulty`: `easy | medium | hard`
- `marks`, optional `negativeMarks`
- `sourceType`: `manual | ai | notes`
- `reviewStatus`: `draft | needs_review | approved | rejected`
- `contentVersion`

Never return `correctAnswer` in quiz-delivery APIs before submission.

### `Quiz`
- `title`, `description`
- `subjectId`, `chapterIds[]`
- `questionRefs[]` with per-question marks/order
- `durationSeconds`
- `availabilityStart`, `availabilityEnd`
- `attemptLimit`
- `shuffleQuestions`, `shuffleOptions`
- `status`: `draft | published | archived`
- `createdBy`

### `QuizAttempt`
- `quizId`, `studentId`
- `answers[]` (question ID and submitted answer)
- `score`, `maxScore`, `accuracy`
- `startedAt`, `submittedAt`
- `status`: `in_progress | submitted | expired`
- `timeSpentSeconds`

### `Assignment`
- `title`, `instructions`
- `subjectId`, `chapterId`
- `attachments[]`
- `dueAt`
- `status`: `draft | published | archived`
- `createdBy`

### `Submission`
- `assignmentId`, `studentId`
- `textAnswer`, `attachments[]`
- `status`: `submitted | reviewed | needs_revision`
- `score`, `feedback`, timestamps

### `Doubt`
- `studentId`, `subjectId`, `chapterId`
- `questionText`, `attachments[]`
- `answerText`, `answerAttachments[]`
- `status`: `pending | in_progress | answered | closed`
- `answeredBy`, timestamps

### `StudyTask`
- `studentId`, `title`, `description`
- `subjectId`, `chapterId`
- `dueAt`, `status`, `sortOrder`

### `Bookmark`
- `studentId`
- `targetType`: `note | question`
- `targetId`

### `Notification`
- `userId`, `type`, `title`, `body`
- `targetUrl`, `readAt`, timestamps

### Optional later collections
- `AIJob` for generation status, errors, usage, and retry safety.
- `AuditLog` for sensitive admin actions.
- `StudySession` for time-based analytics if genuinely needed.

## 8. API outline

Use consistent JSON responses, pagination for lists, and centralized error handling.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh` (only if refresh-token architecture is chosen)

### Subjects/chapters
- `GET /api/subjects`
- `POST /api/admin/subjects`
- `PATCH /api/admin/subjects/:id`
- `GET /api/subjects/:id/chapters`
- `POST /api/admin/subjects/:id/chapters`

### Notes
- `GET /api/chapters/:id/notes`
- `GET /api/notes/:id`
- `POST /api/admin/notes`
- `PATCH /api/admin/notes/:id`
- `POST /api/admin/notes/:id/publish`
- `POST /api/admin/uploads`

### Questions/quizzes
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `PATCH /api/admin/questions/:id`
- `POST /api/admin/questions/:id/approve`
- `POST /api/admin/ai/generate-questions`
- `POST /api/admin/ai/generate-from-notes`
- `POST /api/admin/quizzes`
- `PATCH /api/admin/quizzes/:id`
- `POST /api/admin/quizzes/:id/publish`
- `GET /api/quizzes`
- `GET /api/quizzes/:id`
- `POST /api/quizzes/:id/attempts`
- `POST /api/quiz-attempts/:id/submit`
- `GET /api/quiz-attempts/:id/result`

### Homework/doubts
- `GET /api/assignments`
- `POST /api/admin/assignments`
- `POST /api/assignments/:id/submissions`
- `GET /api/admin/submissions`
- `PATCH /api/admin/submissions/:id/review`
- `POST /api/doubts`
- `GET /api/doubts/mine`
- `GET /api/admin/doubts`
- `PATCH /api/admin/doubts/:id/answer`

### Progress
- `GET /api/student/progress`
- `GET /api/student/revision`
- `POST /api/student/bookmarks`
- `DELETE /api/student/bookmarks/:id`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

These are proposed routes; adjust naming consistently during implementation. Enforce ownership and roles for every resource.

## 9. Mobile-first and accessibility requirements

- Start design at 320px width and test at 360, 390, 768, and desktop widths.
- No page-level horizontal scrolling.
- Buttons and controls should be comfortably tappable (roughly 44px target size).
- Inputs should use readable text sizes and visible labels.
- Do not rely on colour alone for status.
- Keyboard focus and screen-reader labels for forms.
- Equations and diagrams must fit narrow screens; allow local horizontal scrolling for wide equations if necessary.
- Provide loading, empty, success, validation, and error states.
- Save quiz answers locally during an active session where safe, and reconcile with server state; do not rely solely on local state for scoring.
- Confirm before destructive actions and before final quiz submission.
- Respect reduced-motion settings.

## 10. Security and privacy

- Hash passwords with bcrypt or Argon2; never store plaintext passwords.
- Apply role checks and resource ownership checks on the server.
- Validate all inputs and sanitize rich text/HTML.
- Restrict uploads by file size, MIME type, extension, and content where feasible.
- Use signed/private file URLs for private homework/doubt attachments.
- Keep AI provider keys and database credentials server-side.
- Rate-limit login, upload, doubt, and AI-generation endpoints.
- Set safe CORS origins, security headers, and production HTTPS.
- Do not expose correct answers before quiz submission.
- Avoid logging passwords, tokens, private note contents, or student uploads.
- Back up the database and document recovery steps.
- Since the learner is a minor, collect minimal personal data and avoid public profiles, social features, or unnecessary tracking. Obtain appropriate parent/guardian consent where required for the context and applicable law.
- Define deletion/export procedures for student records and uploaded files.

## 11. Testing and quality gates

### Unit tests
- Scoring logic for every question type.
- Question schema validation.
- Role and ownership authorization.
- AI response parsing and malformed-output handling.
- Due-date and attempt-limit logic.

### Integration tests
- Login/logout.
- Admin creates and publishes notes.
- Student cannot see drafts.
- Admin creates quiz; student attempts it; server scores it.
- Correct answers are not present in pre-submission payload.
- Student submits doubt; admin answers it; student can read the answer.
- Student submits homework; admin reviews it.
- Student cannot access another student's records.

### Manual device testing
- Android Chrome at common phone widths.
- Desktop Chrome/Edge.
- Slow network and failed upload.
- Empty state and API errors.
- Keyboard navigation for admin forms.

### Release checklist
- No secrets committed to Git.
- Environment variables documented.
- Production CORS configured.
- Admin account created securely.
- Backups configured.
- Error messages do not reveal internal stack traces.
- Notes and AI-generated questions are reviewed before publication.

## 12. Suggested project structure

```text
studysathi/
├── client/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── subjects/
│   │   │   ├── notes/
│   │   │   ├── quizzes/
│   │   │   ├── homework/
│   │   │   ├── doubts/
│   │   │   ├── progress/
│   │   │   └── admin/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── styles/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   └── storage/
│   │   ├── utils/
│   │   └── app.js
│   └── package.json
├── docs/
│   ├── plan.md
│   └── design.md
├── .env.example
├── .gitignore
└── README.md
```

## 13. Implementation milestones

### Milestone 0 — Confirm foundations
- Confirm product name and environment.
- Create repo, linting, formatting, env validation.
- Create initial database models and seed subjects.
- Establish API error/response conventions.

### Milestone 1 — Authentication and shell
- Login, current user, logout.
- Role middleware and protected routes.
- Responsive admin/student navigation.

### Milestone 2 — Content
- Subject/chapter management.
- Notes editor, file upload, preview, publish workflow.
- Student notes library and reader.

### Milestone 3 — Assessments
- Question bank and manual quiz builder.
- Quiz attempt lifecycle and server scoring.
- Results and explanations.

### Milestone 4 — Tutor workflows
- Doubts and answers.
- Homework and submissions.
- Basic progress overview.

### Milestone 5 — AI productivity
- Manual-parameter question generation.
- Source-notes/PDF generation.
- Validation, review queue, bulk actions.
- Usage limits and clear provider-error states.

### Milestone 6 — Polish and release
- PWA if useful.
- Mobile and accessibility testing.
- Security review, backups, deployment docs.

## 14. Acceptance criteria for MVP

The MVP is ready when:
- Admin can securely log in and manage subjects/chapters.
- Admin can create and publish notes; student sees only published notes.
- Admin can create a question bank and build a quiz.
- Student can take a quiz on a phone and receive server-calculated results.
- Correct answers are hidden until submission.
- Student can submit a doubt with an image; admin can publish a solution.
- Admin can assign homework; student can submit work; admin can review it.
- Student can view their own history and progress.
- All core flows work at 320px and common mobile widths without horizontal page overflow.
- AI-generated questions, when enabled, remain drafts until tutor approval.
- Secrets are not exposed and access-control tests pass.

## 15. Product decisions and assumptions

- Initial deployment is private and serves one tutor plus one student.
- Student is likely school-aged; use age-appropriate copy and minimal data collection.
- Class 8 syllabus must be confirmed from the student's actual textbook/school plan; do not hard-code uncertain chapter lists as official.
- Website/PWA comes before Expo. Expo can later use the same REST API.
- English is the initial content language, with optional Hinglish explanations if desired.
- No payments or public marketplace in the MVP.
