# StudySathi — UI/UX Design System

**Design direction:** Calm academic editorial  
**Primary device:** Student mobile phone  
**Secondary device:** Tutor/admin desktop and laptop  
**Product feel:** Personal, clear, trustworthy, focused, human-made  
**Avoid:** Purple/blue gradients, glassmorphism, excessive rounded cards, decorative blobs, over-animated dashboards, generic AI-generated SaaS aesthetics.

---

## 1. Design goals

1. A student can find today's task, notes, quiz, or doubt flow in seconds.
2. Reading and solving are more prominent than dashboard decoration.
3. Admin can publish notes or build a quiz with minimal clicks.
4. Mobile layouts are intentionally designed, not simply squeezed desktop layouts.
5. The interface uses consistent spacing, typography, controls, and feedback.
6. All status and errors are understandable without relying on colour alone.

## 2. Visual direction

Use a warm, paper-like neutral foundation with charcoal text and a restrained olive accent. The interface should feel like a well-organized study notebook combined with a practical learning tool.

### Colour tokens

| Token | Value | Use |
|---|---|---|
| `--color-page` | `#FAF9F6` | Main page background |
| `--color-surface` | `#FFFFFF` | Content surfaces and forms |
| `--color-surface-muted` | `#F1F0EA` | Secondary grouped areas |
| `--color-text` | `#252525` | Primary text |
| `--color-text-muted` | `#6F706A` | Secondary text |
| `--color-border` | `#E2E1DA` | Dividers and borders |
| `--color-accent` | `#66734D` | Primary action and selected states |
| `--color-accent-hover` | `#56613F` | Hover/pressed action |
| `--color-accent-soft` | `#E9EDDF` | Selected item background |
| `--color-success` | `#35664A` | Success states |
| `--color-warning` | `#8A5A18` | Warnings |
| `--color-danger` | `#A43D35` | Errors/destructive actions |
| `--color-info` | `#4F6254` | Informational status |

Do not use purple or blue gradients. Avoid glass/blur surfaces. Status colours must be accompanied by text or an icon/label.

### Typography
- Primary font: Inter or system UI sans-serif.
- Optional editorial heading font: a restrained serif such as Georgia for selected page titles only; keep body text sans-serif.
- Body text: 16px on mobile where possible.
- Secondary text: 14px minimum for important information.
- Small metadata: 12–13px only when nonessential.
- Line height: 1.5–1.7 for notes; 1.4–1.5 for interface text.
- Math notation should be rendered with KaTeX and have enough vertical space.

### Type scale
- Page title: 28–32px desktop; 24–28px mobile.
- Section title: 20–22px.
- Card/list title: 16–18px.
- Body: 15–16px.
- Metadata: 12–14px.

## 3. Layout and spacing

Use a 4px base spacing system:
- 4px: icon/text micro-gap.
- 8px: tight grouping.
- 12px: form/control internal spacing.
- 16px: standard gap and mobile page padding.
- 24px: section spacing.
- 32px: major section separation.
- 48px: desktop section separation when needed.

### Radius and elevation
- Inputs/buttons: 8px radius.
- Small content surfaces: 10px radius.
- Large containers: 12px radius maximum.
- Prefer borders and whitespace over shadows.
- No glassmorphism, backdrop blur, neon glow, or gradient cards.
- Avoid rounding every small item into a pill; pills are for compact status/tags only.

### Responsive breakpoints
- Small phone: 320–359px.
- Common phone: 360–430px.
- Tablet: 431–767px.
- Small desktop: 768–1199px.
- Wide desktop: 1200px+.

Use fluid widths and sensible max-widths. Never cause page-level horizontal scrolling.

## 4. Shared application shell

### Student mobile shell
- Compact top bar with product name, notification indicator, and profile.
- Main content in a single column.
- Persistent bottom navigation: Home, Subjects, Quizzes, Doubts, More.
- Ensure content is not obscured by bottom navigation; add safe-area padding.
- Use clear text labels alongside icons when space permits.
- Avoid large hero banners and unnecessary welcome illustrations.

### Student desktop shell
- Narrow left sidebar.
- Main content area with a readable max width.
- Optional right rail for upcoming tasks or chapter progress only when useful.
- Sidebar labels remain visible; do not rely on icon-only navigation by default.

### Admin desktop shell
- Left sidebar with: Overview, Subjects & Chapters, Notes, Question Bank, AI Generator, Quizzes, Homework, Doubts, Students, Analytics, Settings.
- Top area contains page title and one primary action.
- Lists and tables should support search, filters, status, and pagination where needed.
- Use a split pane for review workflows where it improves speed.

### Admin mobile shell
- Compact header and drawer/menu navigation.
- Forms use one column.
- Large tables convert into stacked records or controlled horizontal scrolling inside a local container, never the whole page.
- Sticky action bar only when it does not hide content or keyboard fields.

## 5. Key screen specifications

### A. Student dashboard (`/app`)
Order:
1. Greeting and date (compact).
2. “Continue learning” item, if a recent chapter exists.
3. Today's tasks with checkboxes/status.
4. Next quiz or homework deadline.
5. Recent notes/doubt answers.
6. Small progress summary.

Do not lead with a grid of six large metric cards. Show the next useful action first.

Empty state: “Nothing assigned for today. Check your subjects or ask your tutor what to revise next.” Include one relevant action.

### B. Subject and chapter browser
- Subjects as simple rows or modest tiles.
- Chapter list includes title, publication/availability state, and optional progress.
- Show only published student-facing content.
- Keep subject and chapter hierarchy clear.

### C. Notes reader
- Clear title, subject/chapter breadcrumb, last-updated metadata.
- Readable content width and generous line height.
- Formula blocks should be centered or left-aligned consistently and scroll locally if too wide.
- Images have captions/alt text and do not overflow.
- PDF viewer supports zoom and download when allowed.
- Actions: Bookmark, Mark as reviewed, Practice questions.
- Avoid sidebars that shrink the reading column on mobile.

### D. Quiz intro
Show title, subject/chapter, number of questions, duration, attempt limit, and rules before starting. Explain whether answers can be changed and when solutions appear.

### E. Quiz taking
- One question at a time on phones; desktop may show a question navigator.
- Progress such as “Question 4 of 10”.
- Timer only for timed quizzes.
- Answer options use full-width tap targets with clear selected states.
- Previous/Next actions are easy to reach.
- Submission requires confirmation.
- Preserve in-progress answers safely and recover state after a transient refresh where feasible.
- Do not show correctness feedback before submission unless the quiz is explicitly practice mode.
- Provide accessible labels and keyboard controls.

### F. Results and review
- Show score, correct/incorrect/unanswered counts, and time.
- Avoid misleading celebratory animations.
- Each answer shows the student's response, correct answer, and explanation after submission.
- Offer “Review mistakes” and “Try another practice set”.
- Show topic recommendations only when enough evidence exists.

### G. Doubt submission
- Subject and chapter selectors.
- Large labelled text area.
- Optional image upload with preview, remove, and upload-progress states.
- Clear note about not uploading unrelated personal information.
- Submission confirmation and status tracking.
- Student can see only their own doubts.

### H. Admin notes editor
- Title, subject, chapter, summary, rich text, equations, images/PDF attachments.
- Save draft and Publish actions separated.
- Preview at phone width.
- Show unsaved changes and confirm navigation away if needed.
- Sanitize HTML on the server.

### I. Question bank
- Search by prompt text.
- Filters: subject, chapter, difficulty, question type, review status, source.
- Each row shows short prompt, tags, difficulty, status, and actions.
- Bulk selection for approve, reject, archive, or add to quiz.
- Distinguish manually authored, AI-generated, and source-notes-derived questions.

### J. AI question generator
Use a compact step-based form, not a chat-only interface.

Fields:
- Subject, grade, chapter.
- Source: manual settings, selected notes, or PDF.
- Question count.
- Difficulty distribution.
- Question types.
- Language.
- Marks and optional negative marking.
- Include worked explanations toggle.

Workflow:
1. Configure.
2. Generate draft.
3. Validate and review.
4. Approve selected.
5. Save to question bank or create a quiz.

Review screen:
- Show one question per expandable panel or a two-column editor on desktop.
- Show an “AI draft — review required” badge.
- Make prompt, options, answer, and explanation editable.
- Provide regenerate-one, reject, approve, and bulk actions.
- Display validation warnings clearly.
- Never publish AI output automatically.
- Show generation errors, retry action, and usage/limit information without exposing provider details or secrets.

### K. Homework and submissions
- Assignment details and due date.
- Student submission status.
- Text and image upload.
- Admin feedback and score.
- Make late status explicit if late submissions are allowed.
- Do not use colour alone to indicate submitted/late/reviewed.

### L. Progress
- Prioritize trends and actionable chapter-level feedback over vanity metrics.
- Show score history, attempts, completion, and chapters to revisit.
- Explain small sample sizes; avoid labeling a topic “weak” based on one result.
- Keep charts simple and readable on mobile.

## 6. Component conventions

### Buttons
- Primary: solid olive background, white text.
- Secondary: white surface, border, charcoal text.
- Tertiary: text button for low-priority actions.
- Destructive: clearly labelled red action, confirmation when destructive.
- Minimum tap target approximately 44×44px.

### Inputs
- Always have visible labels; placeholders are examples, not labels.
- Show validation beside the field.
- Use suitable mobile keyboard types.
- Keep error messages actionable.
- Disable submit while the request is in progress and prevent duplicate submissions.

### Status badges
Use concise labels: Draft, Published, Needs review, Pending, Answered, Submitted, Reviewed, Needs revision. Pair labels with subtle icon or neutral/accent background.

### Tables and lists
- Use tables for desktop admin data.
- Use stacked list rows/cards on narrow screens.
- Provide empty/loading/error states.
- Preserve filters when returning from a detail page where feasible.

### Dialogs and toasts
- Dialogs only for important confirmations or focused edits.
- Toasts for transient success/failure; do not put critical instructions only in a toast.
- Avoid nested dialogs.

## 7. Motion and interaction

- Use subtle transitions around 120–180ms for hover/focus/state changes.
- No autoplay animations or animated backgrounds.
- Respect `prefers-reduced-motion`.
- Every essential action must work by tap/click; never hide functionality behind hover.
- Loading indicators should not cause major layout shifts.
- Use skeletons sparingly; clear text loading states are acceptable.

## 8. Accessibility and responsive QA

- Semantic headings and landmarks.
- Keyboard navigation and visible focus.
- Proper labels and accessible error associations.
- Contrast target WCAG AA for normal text.
- Do not encode correctness or status only with colour.
- Test 320px, 360px, 390px, 430px, tablet, and desktop.
- Test Android Chrome, desktop Chrome/Edge, and keyboard-only admin workflows.
- Zoom text to 200% without losing key actions.
- Check long mathematical expressions, large images, and PDF content.
- Verify bottom navigation safe areas and on-screen keyboard behavior.

## 9. Design content tone

Use plain, supportive, age-appropriate language. Avoid corporate jargon in student UI.

Preferred:
- “Continue learning”
- “Review your mistakes”
- “Ask a doubt”
- “Your answer is saved”
- “Your tutor has replied”
- “Needs revision”

Avoid:
- Excessive gamification.
- Shame-inducing labels.
- Artificial urgency.
- Overly childish illustrations.
- Excessive emoji.
- Fake streaks or fabricated performance metrics.

## 10. Design acceptance checklist

- [ ] No purple/blue gradients or glassmorphism.
- [ ] Mobile dashboard is purpose-designed.
- [ ] Student can reach notes, quizzes, doubts, and homework quickly.
- [ ] Notes and equations are comfortable to read on a phone.
- [ ] Admin can publish a note with a clear draft/publish flow.
- [ ] AI questions are clearly marked as drafts and require review.
- [ ] Bulk review actions reduce admin effort.
- [ ] Loading, empty, error, success, and validation states exist.
- [ ] No horizontal page overflow at 320px.
- [ ] Text and controls meet practical accessibility needs.
- [ ] Visuals remain restrained and content-led.
