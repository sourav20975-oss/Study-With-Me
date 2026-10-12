import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated: Get subjects with chapters, notes, and question counts
router.get('/subjects', (req, res) => {
  const subjects = store.get('subjects');
  const chapters = store.get('chapters');
  const notes = store.get('notes');
  const questions = store.get('questions') || [];

  const subjectsWithMeta = subjects.map((sub) => {
    const subChapters = chapters.filter((c) => c.subjectId === sub.id && c.isPublished);
    const subNotes = notes.filter((n) => n.subjectId === sub.id && n.status === 'published');
    const subQuestions = questions.filter((q) => q.subjectId === sub.id && q.reviewStatus === 'approved');
    return {
      ...sub,
      chapterCount: subChapters.length,
      noteCount: subNotes.length,
      questionCount: subQuestions.length
    };
  });

  res.json({ subjects: subjectsWithMeta });
});

router.get('/subjects/:id', (req, res) => {
  const subject = store.getById('subjects', req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found.' });

  const allChapters = store.find('chapters', (c) => c.subjectId === subject.id);
  // If request is from admin, return all chapters; else only published
  const isStudent = req.query.role === 'student';
  const chapters = isStudent ? allChapters.filter((c) => c.isPublished) : allChapters;

  res.json({ subject, chapters });
});

router.get('/subjects/:id/chapters', (req, res) => {
  const chapters = store.find('chapters', (c) => c.subjectId === req.params.id);
  res.json({ chapters });
});

// Admin: Create Subject
router.post('/admin/subjects', authenticate, requireRole('admin'), (req, res) => {
  const { name, grade, description, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name is required.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const count = store.get('subjects').length;

  const newSubject = store.create('subjects', {
    name,
    slug,
    grade: grade || 'Class 8',
    description: description || '',
    icon: icon || 'book-open',
    sortOrder: count + 1,
    isActive: true
  });

  res.status(201).json({ subject: newSubject });
});

// Admin: Update Subject
router.patch('/admin/subjects/:id', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('subjects', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Subject not found.' });
  res.json({ subject: updated });
});

// Admin: Create Chapter
router.post('/admin/subjects/:id/chapters', authenticate, requireRole('admin'), (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Chapter title is required.' });

  const chaptersForSub = store.find('chapters', (c) => c.subjectId === req.params.id);

  const newChapter = store.create('chapters', {
    subjectId: req.params.id,
    title,
    description: description || '',
    sortOrder: chaptersForSub.length + 1,
    isPublished: true
  });

  res.status(201).json({ chapter: newChapter });
});

// Admin: Update Chapter
router.patch('/admin/chapters/:id', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('chapters', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Chapter not found.' });
  res.json({ chapter: updated });
});

// Admin: Delete Chapter
router.delete('/admin/chapters/:id', authenticate, requireRole('admin'), (req, res) => {
  const deleted = store.delete('chapters', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Chapter not found.' });
  res.json({ success: true, message: 'Chapter removed.' });
});

export default router;
