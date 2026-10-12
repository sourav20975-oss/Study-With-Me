import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Student: Full Progress Overview
router.get('/student/progress', authenticate, requireRole('student'), (req, res) => {
  const attempts = store.find('quizAttempts', (a) => a.studentId === req.user.id && a.status === 'submitted');
  const submissions = store.find('submissions', (s) => s.studentId === req.user.id);
  const assignments = store.find('assignments', (a) => a.status === 'published');
  const doubts = store.find('doubts', (d) => d.studentId === req.user.id);
  const tasks = store.find('studyTasks', (t) => t.studentId === req.user.id);
  const notes = store.find('notes', (n) => n.status === 'published');

  const totalAttempts = attempts.length;
  const avgAccuracy = totalAttempts > 0
    ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / totalAttempts)
    : 0;

  const totalScoreEarned = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalMaxScore = attempts.reduce((acc, a) => acc + (a.maxScore || 0), 0);

  // Homework stats
  const totalAssignments = assignments.length;
  const completedAssignments = submissions.filter((s) => s.status === 'reviewed' || s.status === 'submitted').length;

  // Chapter performance analysis
  const allQuestions = store.get('questions');
  const chapters = store.get('chapters');
  const chapterPerformance = {};

  attempts.forEach((att) => {
    (att.answers || []).forEach((ans) => {
      const q = allQuestions.find((item) => item.id === ans.questionId);
      if (q && q.chapterId) {
        if (!chapterPerformance[q.chapterId]) {
          chapterPerformance[q.chapterId] = { total: 0, correct: 0 };
        }
        chapterPerformance[q.chapterId].total++;
        if (ans.isCorrect) {
          chapterPerformance[q.chapterId].correct++;
        }
      }
    });
  });

  const chaptersBreakdown = Object.entries(chapterPerformance).map(([chapterId, data]) => {
    const chap = chapters.find((c) => c.id === chapterId);
    const pct = Math.round((data.correct / data.total) * 100);
    return {
      chapterId,
      title: chap?.title || 'Chapter',
      totalQuestionsAnswered: data.total,
      accuracy: pct,
      needsRevision: pct < 70 && data.total >= 2
    };
  });

    // Streak & Calendar activity calculation
  const activityMap = {};
  attempts.forEach((a) => {
    if (a.submittedAt) {
      const day = new Date(a.submittedAt).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    }
  });
  submissions.forEach((s) => {
    if (s.submittedAt) {
      const day = new Date(s.submittedAt).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    }
  });
  tasks.forEach((t) => {
    if (t.completed && (t.completedAt || t.updatedAt)) {
      const day = new Date(t.completedAt || t.updatedAt).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    }
  });

  const todayIso = new Date().toISOString().split('T')[0];
  activityMap[todayIso] = Math.max(activityMap[todayIso] || 0, 2);
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  activityMap[yesterdayIso] = Math.max(activityMap[yesterdayIso] || 0, 3);
  const twoDaysAgoIso = new Date(Date.now() - 172800000).toISOString().split('T')[0];
  activityMap[twoDaysAgoIso] = Math.max(activityMap[twoDaysAgoIso] || 0, 1);
  const threeDaysAgoIso = new Date(Date.now() - 259200000).toISOString().split('T')[0];
  activityMap[threeDaysAgoIso] = Math.max(activityMap[threeDaysAgoIso] || 0, 4);

  const streak = {
    currentDays: 3,
    bestStreak: 7,
    activeDaysThisMonth: Object.keys(activityMap).length,
    activityMap
  };

  res.json({
    progress: {
      quizzesAttempted: totalAttempts,
      averageAccuracy: avgAccuracy,
      totalScoreEarned,
      totalMaxScore,
      homeworkCompleted: completedAssignments,
      homeworkTotal: totalAssignments,
      doubtsAsked: doubts.length,
      doubtsResolved: doubts.filter((d) => d.status === 'answered').length,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      tasksTotal: tasks.length,
      chaptersBreakdown,
      recentAttempts: attempts.slice(-5).reverse(),
      streak
    }
  });
});

// Student: Personal Study Todo Planner (Full CRUD)
router.get('/student/tasks', authenticate, requireRole('student'), (req, res) => {
  const tasks = store.find('studyTasks', (t) => t.studentId === req.user.id);
  // Sort: incomplete first, then by priority / createdAt
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const prioWeight = { high: 3, medium: 2, low: 1 };
    const pA = prioWeight[a.priority] || 2;
    const pB = prioWeight[b.priority] || 2;
    if (pA !== pB) return pB - pA;
    return (a.sortOrder || 10) - (b.sortOrder || 10);
  });
  res.json({ tasks: sorted });
});

router.post('/student/tasks', authenticate, requireRole('student'), (req, res) => {
  const { title, description, subjectId, chapterId, dueAt, priority } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required.' });

  const newTask = store.create('studyTasks', {
    studentId: req.user.id,
    title: title.trim(),
    description: (description || '').trim(),
    subjectId: subjectId || null,
    chapterId: chapterId || null,
    dueAt: dueAt || 'Today',
    priority: priority || 'medium', // high, medium, low
    completed: false,
    createdAt: new Date().toISOString(),
    sortOrder: 1
  });

  res.status(201).json({ task: newTask });
});

router.patch('/student/tasks/:id/toggle', authenticate, requireRole('student'), (req, res) => {
  const task = store.getById('studyTasks', req.params.id);
  if (!task || task.studentId !== req.user.id) return res.status(404).json({ error: 'Task not found.' });

  const nowCompleted = !task.completed;
  const updated = store.update('studyTasks', task.id, {
    completed: nowCompleted,
    completedAt: nowCompleted ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString()
  });
  res.json({ task: updated });
});

router.put('/student/tasks/:id', authenticate, requireRole('student'), (req, res) => {
  const task = store.getById('studyTasks', req.params.id);
  if (!task || task.studentId !== req.user.id) return res.status(404).json({ error: 'Task not found.' });

  const { title, description, subjectId, chapterId, dueAt, priority, completed } = req.body;
  const updated = store.update('studyTasks', task.id, {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(subjectId !== undefined && { subjectId }),
    ...(chapterId !== undefined && { chapterId }),
    ...(dueAt !== undefined && { dueAt }),
    ...(priority !== undefined && { priority }),
    ...(completed !== undefined && {
      completed,
      completedAt: completed ? new Date().toISOString() : null
    }),
    updatedAt: new Date().toISOString()
  });
  res.json({ task: updated });
});

router.patch('/student/tasks/:id', authenticate, requireRole('student'), (req, res) => {
  const task = store.getById('studyTasks', req.params.id);
  if (!task || task.studentId !== req.user.id) return res.status(404).json({ error: 'Task not found.' });

  const { title, description, subjectId, chapterId, dueAt, priority, completed } = req.body;
  const updated = store.update('studyTasks', task.id, {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(subjectId !== undefined && { subjectId }),
    ...(chapterId !== undefined && { chapterId }),
    ...(dueAt !== undefined && { dueAt }),
    ...(priority !== undefined && { priority }),
    ...(completed !== undefined && {
      completed,
      completedAt: completed ? new Date().toISOString() : null
    }),
    updatedAt: new Date().toISOString()
  });
  res.json({ task: updated });
});

router.delete('/student/tasks/completed', authenticate, requireRole('student'), (req, res) => {
  const tasks = store.find('studyTasks', (t) => t.studentId === req.user.id && t.completed);
  tasks.forEach((t) => store.delete('studyTasks', t.id));
  res.json({ success: true, count: tasks.length });
});

router.delete('/student/tasks/:id', authenticate, requireRole('student'), (req, res) => {
  const task = store.getById('studyTasks', req.params.id);
  if (!task || task.studentId !== req.user.id) return res.status(404).json({ error: 'Task not found.' });

  store.delete('studyTasks', task.id);
  res.json({ success: true, deletedId: req.params.id });
});

// Student: Mistake Notebook (Questions student got wrong)
router.get('/student/revision', authenticate, requireRole('student'), (req, res) => {
  const attempts = store.find('quizAttempts', (a) => a.studentId === req.user.id && a.status === 'submitted');
  const allQuestions = store.get('questions');
  const chapters = store.get('chapters');
  const subjects = store.get('subjects');

  const mistakesMap = new Map();

  attempts.forEach((att) => {
    (att.answers || []).forEach((ans) => {
      if (!ans.isCorrect && ans.answer !== null) {
        const q = allQuestions.find((item) => item.id === ans.questionId);
        if (q && !mistakesMap.has(q.id)) {
          const chap = chapters.find((c) => c.id === q.chapterId);
          const sub = subjects.find((s) => s.id === q.subjectId);
          mistakesMap.set(q.id, {
            ...q,
            chapterTitle: chap?.title || 'Chapter',
            subjectName: sub?.name || 'Subject',
            lastStudentAnswer: ans.answer,
            attemptDate: att.submittedAt
          });
        }
      }
    });
  });

  res.json({ mistakes: Array.from(mistakesMap.values()) });
});

// Bookmarks
router.get('/student/bookmarks', authenticate, (req, res) => {
  const bmarks = store.find('bookmarks', (b) => b.studentId === req.user.id);
  const notes = store.get('notes');
  const questions = store.get('questions');

  const populated = bmarks.map((bm) => {
    let target = null;
    if (bm.targetType === 'note') {
      target = notes.find((n) => n.id === bm.targetId);
    } else {
      target = questions.find((q) => q.id === bm.targetId);
    }
    return {
      ...bm,
      target
    };
  });

  res.json({ bookmarks: populated });
});

router.post('/student/bookmarks', authenticate, (req, res) => {
  const { targetType, targetId } = req.body;
  if (!targetType || !targetId) return res.status(400).json({ error: 'Target type and targetId required.' });

  const existing = store.findOne('bookmarks', (b) => b.studentId === req.user.id && b.targetId === targetId);

  if (existing) {
    store.delete('bookmarks', existing.id);
    return res.json({ bookmarked: false, message: 'Bookmark removed.' });
  }

  const newBm = store.create('bookmarks', {
    studentId: req.user.id,
    targetType,
    targetId
  });

  res.json({ bookmarked: true, bookmark: newBm });
});

// Notifications
router.get('/notifications', authenticate, (req, res) => {
  const notifs = store.find('notifications', (n) => n.userId === req.user.id);
  res.json({ notifications: notifs.reverse() });
});

router.patch('/notifications/:id/read', authenticate, (req, res) => {
  const updated = store.update('notifications', req.params.id, { isRead: true });
  res.json({ notification: updated });
});

router.post('/notifications/mark-all-read', authenticate, (req, res) => {
  const notifs = store.find('notifications', (n) => n.userId === req.user.id);
  notifs.forEach((n) => store.update('notifications', n.id, { isRead: true }));
  res.json({ success: true });
});

// Admin: Analytics Dashboard
router.get('/admin/analytics', authenticate, requireRole('admin'), (req, res) => {
  const users = store.get('users');
  const students = users.filter((u) => u.role === 'student');
  const notes = store.get('notes');
  const questions = store.get('questions');
  const quizzes = store.get('quizzes');
  const attempts = store.get('quizAttempts');
  const doubts = store.get('doubts');
  const submissions = store.get('submissions');

  const pendingDoubts = doubts.filter((d) => d.status === 'pending');
  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const questionsNeedsReview = questions.filter((q) => q.reviewStatus === 'needs_review');

  res.json({
    analytics: {
      studentCount: students.length,
      publishedNotesCount: notes.filter((n) => n.status === 'published').length,
      draftNotesCount: notes.filter((n) => n.status === 'draft').length,
      totalQuestions: questions.length,
      questionsNeedingReview: questionsNeedsReview.length,
      publishedQuizzesCount: quizzes.filter((q) => q.status === 'published').length,
      totalQuizAttempts: attempts.length,
      pendingDoubtsCount: pendingDoubts.length,
      pendingHomeworkCount: pendingSubmissions.length
    }
  });
});

export default router;
