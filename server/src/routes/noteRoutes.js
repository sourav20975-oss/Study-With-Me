import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get notes for a chapter
router.get('/chapters/:chapterId/notes', (req, res) => {
  const { chapterId } = req.params;
  const isStudent = req.query.role === 'student';
  const allNotes = store.find('notes', (n) => n.chapterId === chapterId);
  const notes = isStudent ? allNotes.filter((n) => n.status === 'published') : allNotes;
  res.json({ notes });
});

// Get all notes (filterable by subject/status)
router.get('/notes', (req, res) => {
  const { subjectId, status, role } = req.query;
  let notes = store.get('notes');

  if (subjectId) {
    notes = notes.filter((n) => n.subjectId === subjectId);
  }
  if (role === 'student') {
    notes = notes.filter((n) => n.status === 'published');
  } else if (status) {
    notes = notes.filter((n) => n.status === status);
  }

  // Attach subject and chapter title for quick UI rendering
  const subjects = store.get('subjects');
  const chapters = store.get('chapters');

  const populated = notes.map((note) => {
    const sub = subjects.find((s) => s.id === note.subjectId);
    const chap = chapters.find((c) => c.id === note.chapterId);
    return {
      ...note,
      subjectName: sub ? sub.name : 'General',
      chapterTitle: chap ? chap.title : 'Chapter'
    };
  });

  res.json({ notes: populated });
});

// Get note by ID
router.get('/notes/:id', (req, res) => {
  const note = store.getById('notes', req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found.' });

  const subject = store.getById('subjects', note.subjectId);
  const chapter = store.getById('chapters', note.chapterId);

  res.json({
    note: {
      ...note,
      subjectName: subject?.name || 'General',
      chapterTitle: chapter?.title || 'Chapter'
    }
  });
});

// Admin: Create note
router.post('/admin/notes', authenticate, requireRole('admin'), (req, res) => {
  const { subjectId, chapterId, title, summary, contentHtml, attachments, tags, readTimeMinutes, status } = req.body;

  if (!title || !subjectId || !chapterId) {
    return res.status(400).json({ error: 'Subject, chapter, and title are required.' });
  }

  const newNote = store.create('notes', {
    subjectId,
    chapterId,
    createdBy: req.user.id,
    title,
    summary: summary || '',
    contentHtml: contentHtml || '',
    attachments: attachments || [],
    tags: tags || [],
    readTimeMinutes: parseInt(readTimeMinutes) || 5,
    status: status || 'draft',
    publishedAt: status === 'published' ? new Date().toISOString() : null
  });

  res.status(201).json({ note: newNote });
});

// Admin: Update note
router.patch('/admin/notes/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('notes', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found.' });

  const updates = { ...req.body };
  if (updates.status === 'published' && !existing.publishedAt) {
    updates.publishedAt = new Date().toISOString();
  }

  const updated = store.update('notes', req.params.id, updates);
  res.json({ note: updated });
});

// Admin: Publish note
router.post('/admin/notes/:id/publish', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('notes', req.params.id, {
    status: 'published',
    publishedAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Note not found.' });
  res.json({ note: updated });
});

// Admin: Delete note
router.delete('/admin/notes/:id', authenticate, requireRole('admin'), (req, res) => {
  const deleted = store.delete('notes', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Note not found.' });
  res.json({ success: true, message: 'Note deleted.' });
});

export default router;
