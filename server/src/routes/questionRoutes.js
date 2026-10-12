import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateQuestionsWithAI } from '../services/aiService.js';

const router = express.Router();

// Helper: Sync questions into published chapter quizzes so students can take tests immediately
export function syncQuestionsToQuiz(questions, userId = 'usr-admin-1') {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  
  const byChapter = {};
  for (const q of questions) {
    const key = q.chapterId || q.subjectId || 'general';
    if (!byChapter[key]) byChapter[key] = [];
    byChapter[key].push(q);
  }

  const updatedQuizzes = [];

  for (const [chapId, chapQuestions] of Object.entries(byChapter)) {
    const firstQ = chapQuestions[0];
    const subjectId = firstQ.subjectId;
    const subject = store.getById('subjects', subjectId);
    const chapter = chapId !== 'general' ? store.getById('chapters', chapId) : null;

    let quiz = store.findOne('quizzes', (q) => q.chapterId === chapId && q.status === 'published');
    if (!quiz && chapId !== 'general') {
      quiz = store.findOne('quizzes', (q) => q.subjectId === subjectId && q.status === 'published');
    }

    if (quiz) {
      const existingIds = new Set((quiz.questionRefs || []).map((r) => r.questionId));
      for (const q of chapQuestions) {
        if (!existingIds.has(q.id)) {
          quiz.questionRefs.push({
            questionId: q.id,
            marks: q.marks || 1
          });
        }
      }
      quiz.durationSeconds = Math.max(300, quiz.questionRefs.length * 120);
      store.update('quizzes', quiz.id, {
        questionRefs: quiz.questionRefs,
        durationSeconds: quiz.durationSeconds
      });
      updatedQuizzes.push(quiz);
    } else {
      const title = chapter
        ? `${subject?.name || 'Class 8'}: ${chapter.title} Practice Test`
        : `${subject?.name || 'Class 8'} Practice Assessment`;

      const newQuiz = store.create('quizzes', {
        title,
        description: `Comprehensive practice test with ${chapQuestions.length} ICSE questions.`,
        subjectId,
        chapterId: chapId !== 'general' ? chapId : undefined,
        createdBy: userId,
        status: 'published',
        durationSeconds: Math.max(300, chapQuestions.length * 120),
        attemptLimit: 10,
        questionRefs: chapQuestions.map((q) => ({
          questionId: q.id,
          marks: q.marks || 1
        }))
      });
      updatedQuizzes.push(newQuiz);
    }
  }

  return updatedQuizzes;
}

// Student & General: Get Approved Questions for Practice & Syllabus
router.get('/questions', authenticate, (req, res) => {
  const { subjectId, chapterId, difficulty, type } = req.query;
  let questions = store.get('questions');

  if (req.user.role === 'student') {
    questions = questions.filter((q) => q.reviewStatus === 'approved');
  } else if (req.query.reviewStatus) {
    questions = questions.filter((q) => q.reviewStatus === req.query.reviewStatus);
  }

  if (subjectId) questions = questions.filter((q) => q.subjectId === subjectId);
  if (chapterId) questions = questions.filter((q) => q.chapterId === chapterId);
  if (difficulty) questions = questions.filter((q) => q.difficulty === difficulty);
  if (type) questions = questions.filter((q) => q.type === type);

  const subjects = store.get('subjects');
  const chapters = store.get('chapters');

  const populated = questions.map((q) => {
    const sub = subjects.find((s) => s.id === q.subjectId);
    const chap = chapters.find((c) => c.id === q.chapterId);
    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      subjectName: sub?.name || 'General',
      chapterTitle: chap?.title || 'Chapter'
    };
  });

  res.json({ questions: populated });
});


// Admin: Get Question Bank
router.get('/admin/questions', authenticate, requireRole('admin'), (req, res) => {
  const { subjectId, chapterId, difficulty, type, reviewStatus, search } = req.query;
  let questions = store.get('questions');

  if (subjectId) questions = questions.filter((q) => q.subjectId === subjectId);
  if (chapterId) questions = questions.filter((q) => q.chapterId === chapterId);
  if (difficulty) questions = questions.filter((q) => q.difficulty === difficulty);
  if (type) questions = questions.filter((q) => q.type === type);
  if (reviewStatus) questions = questions.filter((q) => q.reviewStatus === reviewStatus);

  if (search) {
    const s = search.toLowerCase();
    questions = questions.filter((q) => q.prompt.toLowerCase().includes(s));
  }

  const subjects = store.get('subjects');
  const chapters = store.get('chapters');

  const populated = questions.map((q) => {
    const sub = subjects.find((s) => s.id === q.subjectId);
    const chap = chapters.find((c) => c.id === q.chapterId);
    return {
      ...q,
      subjectName: sub?.name || 'General',
      chapterTitle: chap?.title || 'Chapter'
    };
  });

  res.json({ questions: populated });
});

// Admin: Create Question Manually
router.post('/admin/questions', authenticate, requireRole('admin'), (req, res) => {
  const { subjectId, chapterId, type, prompt, options, correctAnswer, explanation, difficulty, marks, negativeMarks } = req.body;

  if (!subjectId || !chapterId || !prompt) {
    return res.status(400).json({ error: 'Subject, chapter, and prompt are required.' });
  }

  const newQuestion = store.create('questions', {
    subjectId,
    chapterId,
    createdBy: req.user.id,
    type: type || 'single_select',
    prompt,
    options: options || [],
    correctAnswer: String(correctAnswer ?? '0'),
    explanation: explanation || '',
    difficulty: difficulty || 'medium',
    marks: parseInt(marks) || 1,
    negativeMarks: parseFloat(negativeMarks) || 0,
    sourceType: 'manual',
    reviewStatus: 'approved'
  });

  res.status(201).json({ question: newQuestion });
});

// Admin: Update Question
router.patch('/admin/questions/:id', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('questions', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Question not found.' });
  res.json({ question: updated });
});

// Admin: Approve Question
router.post('/admin/questions/:id/approve', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('questions', req.params.id, { reviewStatus: 'approved' });
  if (!updated) return res.status(404).json({ error: 'Question not found.' });
  res.json({ question: updated });
});

// Admin: Bulk Review (Approve / Reject / Archive)
router.post('/admin/questions/bulk-review', authenticate, requireRole('admin'), (req, res) => {
  const { questionIds, action } = req.body;
  if (!Array.isArray(questionIds) || !action) {
    return res.status(400).json({ error: 'Invalid questionIds or action.' });
  }

  let updatedCount = 0;
  questionIds.forEach((id) => {
    if (action === 'approve') {
      store.update('questions', id, { reviewStatus: 'approved' });
      updatedCount++;
    } else if (action === 'reject') {
      store.update('questions', id, { reviewStatus: 'rejected' });
      updatedCount++;
    } else if (action === 'delete') {
      store.delete('questions', id);
      updatedCount++;
    }
  });

  res.json({ success: true, count: updatedCount });
});

// Admin: Delete Question
router.delete('/admin/questions/:id', authenticate, requireRole('admin'), (req, res) => {
  const deleted = store.delete('questions', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Question not found.' });
  res.json({ success: true, message: 'Question deleted.' });
});

// Admin: Bulk Import Questions
router.post('/admin/questions/bulk-import', authenticate, requireRole('admin'), (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Valid array of questions required.' });
  }

  const created = questions.map((q) => {
    return store.create('questions', {
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      createdBy: req.user.id,
      type: q.type || 'single_select',
      prompt: q.prompt,
      options: q.options || [],
      correctAnswer: String(q.correctAnswer ?? '0'),
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: parseInt(q.marks) || 1,
      negativeMarks: parseFloat(q.negativeMarks) || 0,
      sourceType: q.sourceType || 'manual',
      reviewStatus: q.reviewStatus || 'approved'
    });
  });

  res.status(201).json({ success: true, count: created.length, questions: created });
});

// Admin: AI Question Generator
router.post('/admin/ai/generate-questions', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      subjectId,
      chapterId,
      grade,
      count,
      difficulty,
      questionType,
      language,
      marks,
      includeExplanations,
      saveDirectly
    } = req.body;

    const subject = store.getById('subjects', subjectId);
    const chapter = store.getById('chapters', chapterId);

    const generated = await generateQuestionsWithAI({
      subjectId,
      subjectName: subject?.name || 'Class 8 Subject',
      chapterId,
      chapterTitle: chapter?.title || 'General',
      grade: grade || 'Class 8',
      count,
      difficulty,
      questionType,
      language,
      marks,
      includeExplanations
    });

    // If requested to save directly as drafts to DB
    if (saveDirectly) {
      const saved = generated.map((q) =>
        store.create('questions', {
          ...q,
          createdBy: req.user.id,
          reviewStatus: 'approved'
        })
      );
      const quizzes = syncQuestionsToQuiz(saved, req.user.id);
      return res.json({ questions: saved, quizzes });
    }

    // Return drafts for immediate client review
    res.json({ questions: generated });
  } catch (err) {
    console.error('AI Generation error:', err);
    res.status(500).json({ error: 'Failed to generate questions. ' + err.message });
  }
});

// Admin: AI Generator from existing note text
router.post('/admin/ai/generate-from-notes', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { noteId, count, difficulty, marks } = req.body;
    const note = store.getById('notes', noteId);
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    const subject = store.getById('subjects', note.subjectId);
    const chapter = store.getById('chapters', note.chapterId);

    const generated = await generateQuestionsWithAI({
      subjectId: note.subjectId,
      subjectName: subject?.name || 'Mathematics',
      chapterId: note.chapterId,
      chapterTitle: chapter?.title || 'General',
      sourceType: 'notes',
      sourceContent: note.contentHtml || note.summary,
      count: count || 3,
      difficulty: difficulty || 'medium',
      marks: marks || 2
    });

    res.json({ questions: generated, sourceNote: note.title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate from notes. ' + err.message });
  }
});

// Admin: Save reviewed questions from AI generator
router.post('/admin/ai/save-approved', authenticate, requireRole('admin'), (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Questions list required.' });
  }

  const savedList = questions.map((q) => {
    return store.create('questions', {
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      createdBy: req.user.id,
      type: q.type || 'single_select',
      prompt: q.prompt,
      options: q.options || [],
      correctAnswer: String(q.correctAnswer ?? '0'),
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: parseInt(q.marks) || 1,
      negativeMarks: 0,
      sourceType: q.sourceType || 'ai',
      reviewStatus: 'approved'
    });
  });

  const quizzes = syncQuestionsToQuiz(savedList, req.user.id);
  res.json({ success: true, count: savedList.length, saved: savedList, quizzes });
});

export default router;
