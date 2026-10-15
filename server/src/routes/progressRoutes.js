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

  const allQuizzes = store.get('quizzes') || [];
  const allQuestions = store.get('questions') || [];
  const subjects = store.get('subjects') || [];
  const chapters = store.get('chapters') || [];

  // Helper to resolve quiz metadata
  const resolveQuizMeta = (quizId) => {
    const qz = allQuizzes.find((q) => q.id === quizId);
    if (qz) return qz;
    if (quizId?.includes('math')) return { title: 'Mathematics Practice Quiz', subjectId: 'sub-maths' };
    if (quizId?.includes('sci')) return { title: 'Science Atoms & Matter Quiz', subjectId: 'sub-science' };
    if (quizId?.includes('eng')) return { title: 'English Prose & Grammar Test', subjectId: 'sub-english' };
    if (quizId?.includes('soc')) return { title: 'Social Science Assessment', subjectId: 'sub-social' };
    return { title: 'Class 8 Practice Assessment', subjectId: 'sub-maths' };
  };

  // 1. Dynamic Accuracy Trend (chronological attempts)
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0));

  const accuracyTrend = sortedAttempts.map((att, idx) => {
    const qz = resolveQuizMeta(att.quizId);
    const dateObj = new Date(att.submittedAt || Date.now());
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const acc = att.accuracy !== undefined ? Math.round(att.accuracy) : Math.round(((att.score || 0) / (att.maxScore || 1)) * 100);

    return {
      testNumber: idx + 1,
      title: qz.title || `Assessment #${idx + 1}`,
      date: formattedDate,
      accuracy: acc,
      score: `${att.score}/${att.maxScore}`,
      subjectId: qz.subjectId
    };
  });

  // Calculate change in accuracy from previous attempt to latest attempt
  let accuracyChange = null;
  if (sortedAttempts.length >= 2) {
    const latestAtt = sortedAttempts[sortedAttempts.length - 1];
    const prevAtt = sortedAttempts[sortedAttempts.length - 2];
    const latestAcc = latestAtt.accuracy !== undefined ? latestAtt.accuracy : Math.round(((latestAtt.score || 0) / (latestAtt.maxScore || 1)) * 100);
    const prevAcc = prevAtt.accuracy !== undefined ? prevAtt.accuracy : Math.round(((prevAtt.score || 0) / (prevAtt.maxScore || 1)) * 100);
    accuracyChange = Math.round(latestAcc - prevAcc);
  }

  // Average time spent per quiz in minutes
  const avgDurationMinutes = totalAttempts > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / (totalAttempts * 60))
    : 0;

  // 2. Dynamic Subject-Wise Performance (No fake 70%!)
  const subjectPerformance = subjects.map((sub) => {
    const subAttempts = attempts.filter((att) => {
      const qz = resolveQuizMeta(att.quizId);
      if (qz.subjectId === sub.id) return true;
      if (sub.id === 'sub-maths' && att.quizId?.includes('math')) return true;
      if (sub.id === 'sub-science' && att.quizId?.includes('sci')) return true;
      if (sub.id === 'sub-english' && att.quizId?.includes('eng')) return true;
      if (sub.id === 'sub-social' && att.quizId?.includes('soc')) return true;
      // Also check if any question answered in attempt belongs to this subject
      return (att.answers || []).some((ans) => {
        const q = allQuestions.find((item) => item.id === ans.questionId);
        return q?.subjectId === sub.id;
      });
    });

    let subAccuracy = 0;
    let totalQuestionsPracticed = 0;
    const attempted = subAttempts.length > 0;

    if (attempted) {
      const totalAcc = subAttempts.reduce((acc, a) => {
        const itemAcc = a.accuracy !== undefined ? a.accuracy : Math.round(((a.score || 0) / (a.maxScore || 1)) * 100);
        return acc + itemAcc;
      }, 0);
      subAccuracy = Math.round(totalAcc / subAttempts.length);
      totalQuestionsPracticed = subAttempts.reduce((acc, a) => acc + (a.answers?.length || 0), 0);
    }

    const colorMap = {
      'sub-maths': { color: '#f97316', gradient: 'from-orange-500 to-amber-500' },
      'sub-science': { color: '#0d9488', gradient: 'from-teal-500 to-emerald-500' },
      'sub-english': { color: '#eab308', gradient: 'from-amber-500 to-yellow-500' },
      'sub-social': { color: '#6366f1', gradient: 'from-indigo-500 to-purple-500' }
    };
    const colors = colorMap[sub.id] || { color: '#f97316', gradient: 'from-orange-500 to-amber-500' };

    return {
      name: sub.name,
      code: sub.id.replace('sub-', ''),
      subjectId: sub.id,
      accuracy: subAccuracy,
      target: 75,
      questionsPracticed: totalQuestionsPracticed,
      attempted,
      color: colors.color,
      gradient: colors.gradient
    };
  });

  // 3. Dynamic Streak & Calendar activity calculation (From authentic events only)
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
  doubts.forEach((d) => {
    if (d.createdAt) {
      const day = new Date(d.createdAt).toISOString().split('T')[0];
      activityMap[day] = (activityMap[day] || 0) + 1;
    }
  });

  // Calculate real consecutive days streak
  const todayDate = new Date();
  const todayIso = todayDate.toISOString().split('T')[0];
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = new Date();
  if (!activityMap[todayIso] && activityMap[yesterdayIso]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const iso = checkDate.toISOString().split('T')[0];
    if (activityMap[iso] > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak historically
  const sortedDates = Object.keys(activityMap)
    .filter((d) => activityMap[d] > 0)
    .sort();

  let bestStreak = 0;
  let tempStreak = 0;
  let prevTimestamp = 0;

  for (const dateStr of sortedDates) {
    const ts = new Date(dateStr).getTime();
    if (prevTimestamp === 0) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((ts - prevTimestamp) / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevTimestamp = ts;
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  const currentYearMonth = todayIso.slice(0, 7);
  const activeDaysThisMonth = Object.keys(activityMap).filter(
    (d) => d.startsWith(currentYearMonth) && activityMap[d] > 0
  ).length;

  const streak = {
    currentDays: currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    activeDaysThisMonth,
    activityMap
  };

  // 4. Dynamic 7-Day Study Effort (Weekly Pillars)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyStudyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];

    const dayAttempts = attempts.filter((a) => (a.submittedAt || '').startsWith(dateStr));
    const daySubs = submissions.filter((s) => (s.submittedAt || '').startsWith(dateStr));
    const dayTasks = tasks.filter((t) => t.completed && (t.completedAt || t.updatedAt || '').startsWith(dateStr));

    const qCount = dayAttempts.reduce((acc, a) => acc + (a.answers?.length || 0), 0);
    const attemptMins = dayAttempts.reduce((acc, a) => acc + Math.round((a.timeSpentSeconds || 600) / 60), 0);
    const totalMins = attemptMins + (daySubs.length * 20) + (dayTasks.length * 15);

    weeklyStudyActivity.push({
      day: dayName,
      date: dateStr,
      minutes: totalMins,
      questions: qCount,
      label: `${dayName}: ${totalMins}m · ${qCount} Qs`
    });
  }

  // 5. Dynamic Chapters Breakdown (Real accuracy per chapter)
  const chaptersBreakdown = chapters.map((chap) => {
    const chapQuestions = allQuestions.filter((q) => q.chapterId === chap.id);
    const chapQuestionIds = new Set(chapQuestions.map((q) => q.id));

    let totalAnswered = 0;
    let totalCorrect = 0;

    attempts.forEach((att) => {
      const qz = resolveQuizMeta(att.quizId);
      const isChapQuiz = qz.chapterId === chap.id || qz.chapterIds?.includes(chap.id);

      (att.answers || []).forEach((ans) => {
        // Match 1: Directly linked question ID
        if (chapQuestionIds.has(ans.questionId)) {
          totalAnswered++;
          if (ans.isCorrect) totalCorrect++;
          return;
        }

        // Match 2: Quiz explicitly tagged with this chapter
        if (isChapQuiz) {
          totalAnswered++;
          if (ans.isCorrect) totalCorrect++;
          return;
        }

        // Match 3: If questions in the quiz have empty chapterId, but belongs to this subject
        const qObj = allQuestions.find((item) => item.id === ans.questionId);
        const ansSubjectId = qObj?.subjectId || qz.subjectId;
        if (ansSubjectId === chap.subjectId) {
          const sameSubChapters = chapters.filter((c) => c.subjectId === chap.subjectId);
          if (sameSubChapters.length === 1) {
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;
            return;
          }
          const titleWords = chap.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          const qText = `${qz.title || ''} ${qObj?.prompt || ''}`.toLowerCase();
          if (titleWords.some((w) => qText.includes(w))) {
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;
          }
        }
      });
    });

    let accuracy = 0;
    let status = 'unattempted'; // 'mastered' | 'learning' | 'needs_revision' | 'unattempted'
    let needsRevision = false;
    let isMastered = false;

    if (totalAnswered > 0) {
      accuracy = Math.round((totalCorrect / totalAnswered) * 100);
      needsRevision = accuracy < 70;
      isMastered = accuracy >= 80;
      status = accuracy >= 80 ? 'mastered' : accuracy >= 60 ? 'learning' : 'needs_revision';
    }

    const sub = subjects.find((s) => s.id === chap.subjectId);

    return {
      chapterId: chap.id,
      title: chap.title,
      subjectId: chap.subjectId,
      subjectName: sub?.name || 'Class 8 Syllabus',
      totalQuestionsAnswered: totalAnswered,
      accuracy,
      status,
      needsRevision,
      isMastered
    };
  });

  // 6. Dynamic Mastery Distribution (Donut Ring Chart with 4 authentic tiers)
  const totalChaps = chaptersBreakdown.length || 1;
  const masteredList = chaptersBreakdown.filter((c) => c.status === 'mastered');
  const learningList = chaptersBreakdown.filter((c) => c.status === 'learning');
  const revisionList = chaptersBreakdown.filter((c) => c.status === 'needs_revision');
  const unattemptedList = chaptersBreakdown.filter((c) => c.status === 'unattempted');

  const masteryDistribution = {
    masteredCount: masteredList.length,
    learningCount: learningList.length,
    revisionCount: revisionList.length,
    unattemptedCount: unattemptedList.length,
    totalChapters: chaptersBreakdown.length,
    masteredPct: Math.round((masteredList.length / totalChaps) * 100),
    learningPct: Math.round((learningList.length / totalChaps) * 100),
    revisionPct: Math.round((revisionList.length / totalChaps) * 100),
    unattemptedPct: Math.max(
      0,
      100 -
        Math.round((masteredList.length / totalChaps) * 100) -
        Math.round((learningList.length / totalChaps) * 100) -
        Math.round((revisionList.length / totalChaps) * 100)
    )
  };

  res.json({
    progress: {
      quizzesAttempted: totalAttempts,
      averageAccuracy: avgAccuracy,
      accuracyChange,
      avgDurationMinutes,
      totalScoreEarned,
      totalMaxScore,
      homeworkCompleted: completedAssignments,
      homeworkTotal: totalAssignments,
      doubtsAsked: doubts.length,
      doubtsResolved: doubts.filter((d) => d.status === 'answered').length,
      tasksCompleted: tasks.filter((t) => t.completed).length,
      tasksTotal: tasks.length,
      chaptersBreakdown,
      subjectPerformance,
      weeklyStudyActivity,
      accuracyTrend,
      masteryDistribution,
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

// Admin: Analytics Dashboard (supports both /admin/analytics and /analytics/dashboard)
const handleAdminAnalytics = (req, res) => {
  const users = store.get('users') || [];
  const students = users.filter((u) => u.role === 'student');
  const notes = store.get('notes') || [];
  const questions = store.get('questions') || [];
  const quizzes = store.get('quizzes') || [];
  const attempts = store.get('quizAttempts') || [];
  const doubts = store.get('doubts') || [];
  const submissions = store.get('submissions') || [];
  const subjects = store.get('subjects') || [];
  const chapters = store.get('chapters') || [];

  const pendingDoubts = doubts.filter((d) => d.status === 'pending');
  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const questionsNeedsReview = questions.filter((q) => q.reviewStatus === 'needs_review');

  const subjectsWithCounts = subjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    chapters: chapters.filter((c) => c.subjectId === sub.id).length,
    notes: notes.filter((n) => n.subjectId === sub.id && n.status === 'published').length
  }));

  const stats = {
    studentCount: students.length,
    publishedNotesCount: notes.filter((n) => n.status === 'published').length,
    draftNotesCount: notes.filter((n) => n.status === 'draft').length,
    totalQuestions: questions.length,
    questionsNeedingReview: questionsNeedsReview.length,
    publishedQuizzesCount: quizzes.filter((q) => q.status === 'published').length,
    totalQuizAttempts: attempts.length,
    pendingDoubtsCount: pendingDoubts.length,
    pendingHomeworkCount: pendingSubmissions.length,
    subjects: subjectsWithCounts
  };

  res.json({
    analytics: stats,
    stats
  });
};

router.get('/admin/analytics', authenticate, requireRole('admin'), handleAdminAnalytics);
router.get('/analytics/dashboard', authenticate, requireRole('admin'), handleAdminAnalytics);

export default router;
