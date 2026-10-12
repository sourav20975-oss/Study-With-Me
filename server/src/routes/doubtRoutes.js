import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = express.Router();

// Student: Get my doubts
router.get('/doubts/mine', authenticate, requireRole('student'), (req, res) => {
  const doubts = store.find('doubts', (d) => d.studentId === req.user.id);
  const subjects = store.get('subjects');
  const chapters = store.get('chapters');

  const populated = doubts.map((d) => {
    const sub = subjects.find((s) => s.id === d.subjectId);
    const chap = chapters.find((c) => c.id === d.chapterId);
    return {
      ...d,
      subjectName: sub?.name || 'General',
      chapterTitle: chap?.title || 'Chapter'
    };
  });

  res.json({ doubts: populated });
});

// Student: Submit a doubt
router.post('/doubts', authenticate, requireRole('student'), (req, res) => {
  const { subjectId, chapterId, questionText, attachments } = req.body;
  if (!subjectId || !chapterId || !questionText) {
    return res.status(400).json({ error: 'Subject, chapter, and question text are required.' });
  }

  const newDoubt = store.create('doubts', {
    studentId: req.user.id,
    studentName: req.user.name,
    subjectId,
    chapterId,
    questionText,
    attachments: attachments || [],
    answerText: '',
    answerAttachments: [],
    status: 'pending',
    answeredBy: null,
    answeredAt: null
  });

  res.status(201).json({ doubt: newDoubt });
});

// Student: Delete own pending doubt
router.delete('/doubts/:id', authenticate, requireRole('student'), (req, res) => {
  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });
  if (doubt.studentId !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' });

  store.delete('doubts', req.params.id);
  res.json({ success: true, message: 'Doubt deleted.' });
});

// Get single doubt
router.get('/doubts/:id', authenticate, (req, res) => {
  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });

  if (req.user.role === 'student' && doubt.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const subject = store.getById('subjects', doubt.subjectId);
  const chapter = store.getById('chapters', doubt.chapterId);

  res.json({
    doubt: {
      ...doubt,
      subjectName: subject?.name || 'General',
      chapterTitle: chapter?.title || 'Chapter'
    }
  });
});

// Admin: Get all doubts (with optional status & subject filter)
router.get('/admin/doubts', authenticate, requireRole('admin'), (req, res) => {
  let doubts = store.get('doubts') || [];
  const { status, subjectId, search } = req.query;

  if (status && status !== 'all') {
    doubts = doubts.filter((d) => d.status === status);
  }
  if (subjectId && subjectId !== 'all') {
    doubts = doubts.filter((d) => d.subjectId === subjectId);
  }
  if (search) {
    const s = search.toLowerCase();
    doubts = doubts.filter(
      (d) =>
        d.questionText?.toLowerCase().includes(s) ||
        d.studentName?.toLowerCase().includes(s) ||
        d.answerText?.toLowerCase().includes(s)
    );
  }

  const subjects = store.get('subjects') || [];
  const chapters = store.get('chapters') || [];

  const populated = doubts.map((d) => {
    const sub = subjects.find((s) => s.id === d.subjectId);
    const chap = chapters.find((c) => c.id === d.chapterId);
    return {
      ...d,
      subjectName: sub?.name || 'General',
      chapterTitle: chap?.title || 'Chapter'
    };
  });

  // Sort: pending first, then by date
  populated.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  res.json({ doubts: populated });
});

// Admin: Answer / Edit Answer for doubt
router.patch('/admin/doubts/:id/answer', authenticate, requireRole('admin'), (req, res) => {
  const { answerText, answerAttachments } = req.body;
  if (!answerText) {
    return res.status(400).json({ error: 'Answer explanation text is required.' });
  }

  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });

  const updated = store.update('doubts', req.params.id, {
    answerText: answerText.trim(),
    answerAttachments: answerAttachments || doubt.answerAttachments || [],
    status: 'answered',
    answeredBy: req.user.name || 'Tutor',
    answeredAt: new Date().toISOString()
  });

  // Notify student
  store.create('notifications', {
    userId: doubt.studentId,
    type: 'doubt_answered',
    title: `Your doubt has been answered by ${req.user.name || 'Tutor'}`,
    body: `Answer: "${answerText.slice(0, 80)}..." Click to view complete solution.`,
    targetUrl: `/app/doubts/${doubt.id}`,
    isRead: false
  });

  res.json({ doubt: updated });
});

// Admin: Update Doubt (Re-open, edit, etc.)
router.patch('/admin/doubts/:id', authenticate, requireRole('admin'), (req, res) => {
  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });

  const updated = store.update('doubts', req.params.id, req.body);
  res.json({ doubt: updated });
});

// Admin: Delete Doubt
router.delete('/admin/doubts/:id', authenticate, requireRole('admin'), (req, res) => {
  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });

  store.delete('doubts', req.params.id);
  res.json({ success: true, message: 'Doubt deleted successfully.' });
});

// Admin: Draft AI Answer for Student Doubt
router.post('/admin/doubts/:id/ai-answer', authenticate, requireRole('admin'), async (req, res) => {
  const doubt = store.getById('doubts', req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found.' });

  const subject = store.getById('subjects', doubt.subjectId);
  const chapter = store.getById('chapters', doubt.chapterId);

  // Fallback high-quality answer if AI is offline
  let aiAnswer = `Hello ${doubt.studentName || 'there'}! Great question.

1. **Step 1:** Read the problem carefully and identify the given terms.
2. **Step 2:** Follow the standard ICSE order of operations (BODMAS).
   * First expand brackets completely on both sides:
   * Group like terms (variables on LHS, constants on RHS).
3. **Step 3:** Remember the golden sign rule: when a positive term crosses the '=' sign, it becomes negative, and vice-versa.
4. **Step 4:** Simplify both sides and isolate the variable.

**Golden Rule:** Always expand brackets first to avoid sign transposition mistakes!`;

  if (config.groqApiKey) {
    try {
      const systemPrompt = `You are Sourav Kumar, an expert friendly ICSE Class 8 tutor.
A student asked this doubt in ${subject?.name || 'Class 8'} (${chapter?.title || 'General'}):
"${doubt.questionText}"

Provide a warm, clear, step-by-step worked solution.
Use numbered steps: Step 1, Step 2, Step 3.
Format math equations cleanly using LaTeX $ ... $ syntax.
Include a helpful pro-tip or golden rule at the end.`;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groqApiKey}`
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            { role: 'system', content: 'You are an encouraging ICSE Class 8 expert teacher.' },
            { role: 'user', content: systemPrompt }
          ],
          temperature: 0.3
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (content) {
          aiAnswer = content;
        }
      }
    } catch (err) {
      console.warn('Groq AI doubt draft failed, using structured template:', err.message);
    }
  }

  res.json({ suggestedAnswer: aiAnswer });
});

export default router;
