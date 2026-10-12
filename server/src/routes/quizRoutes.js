import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Quizzes (Students get published only, Admin gets all)
router.get('/quizzes', authenticate, (req, res) => {
  let quizzes = store.get('quizzes');
  if (req.user.role === 'student') {
    quizzes = quizzes.filter((q) => q.status === 'published');
  }

  const subjects = store.get('subjects');
  const attempts = store.get('quizAttempts');

  const populated = quizzes.map((q) => {
    const sub = subjects.find((s) => s.id === q.subjectId);
    const userAttempts = attempts.filter((a) => a.quizId === q.id && a.studentId === req.user.id);
    const latestAttempt = userAttempts[userAttempts.length - 1] || null;

    return {
      ...q,
      subjectName: sub?.name || 'General',
      questionCount: q.questionRefs?.length || 0,
      attemptsUsed: userAttempts.length,
      latestAttemptScore: latestAttempt?.score ?? null,
      latestAttemptMax: latestAttempt?.maxScore ?? null
    };
  });

  res.json({ quizzes: populated });
});

// Get Quiz Detail (Includes rules & question count, but hides questions or delivers test view)
router.get('/quizzes/:id', authenticate, (req, res) => {
  const quiz = store.getById('quizzes', req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

  const subject = store.getById('subjects', quiz.subjectId);
  const attempts = store.find('quizAttempts', (a) => a.quizId === quiz.id && a.studentId === req.user.id);

  // If student requests the quiz to start, return questions WITHOUT correct answers or explanations!
  const allQuestions = store.get('questions');
  const safeQuestions = quiz.questionRefs.map((ref) => {
    const q = allQuestions.find((item) => item.id === ref.questionId);
    if (!q) return null;
    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options || [],
      marks: ref.marks || q.marks || 1,
      difficulty: q.difficulty
      // NOTE: correctAnswer and explanation are deliberately omitted for security!
    };
  }).filter(Boolean);

  res.json({
    quiz: {
      ...quiz,
      subjectName: subject?.name || 'General',
      questions: safeQuestions,
      attemptsCount: attempts.length,
      hasAttemptsRemaining: quiz.attemptLimit ? attempts.length < quiz.attemptLimit : true
    }
  });
});

// Student: Start a Quiz Attempt
router.post('/quizzes/:id/attempts', authenticate, requireRole('student'), (req, res) => {
  const quiz = store.getById('quizzes', req.params.id);
  if (!quiz || quiz.status !== 'published') {
    return res.status(404).json({ error: 'Quiz not available.' });
  }

  const existingAttempts = store.find('quizAttempts', (a) => a.quizId === quiz.id && a.studentId === req.user.id);
  if (quiz.attemptLimit && existingAttempts.length >= quiz.attemptLimit) {
    return res.status(400).json({ error: `Attempt limit of ${quiz.attemptLimit} reached for this quiz.` });
  }

  const newAttempt = store.create('quizAttempts', {
    quizId: quiz.id,
    studentId: req.user.id,
    answers: [],
    score: 0,
    maxScore: 0,
    accuracy: 0,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    status: 'in_progress',
    timeSpentSeconds: 0
  });

  res.status(201).json({ attempt: newAttempt });
});

// Student: Submit Quiz Attempt (Server-side scoring)
router.post('/quiz-attempts/:id/submit', authenticate, requireRole('student'), (req, res) => {
  const attempt = store.getById('quizAttempts', req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

  if (attempt.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized attempt access.' });
  }

  if (attempt.status === 'submitted') {
    return res.status(400).json({ error: 'Attempt has already been submitted.' });
  }

  const quiz = store.getById('quizzes', attempt.quizId);
  if (!quiz) return res.status(404).json({ error: 'Associated quiz not found.' });

  const { answers = [], timeSpentSeconds = 0 } = req.body;
  const allQuestions = store.get('questions');

  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;

  const scoredAnswers = quiz.questionRefs.map((ref) => {
    const q = allQuestions.find((item) => item.id === ref.questionId);
    if (!q) return null;

    const qMarks = ref.marks || q.marks || 1;
    maxScore += qMarks;

    const studentSubmission = answers.find((a) => a.questionId === q.id);
    const submittedVal = studentSubmission ? String(studentSubmission.answer).trim() : null;
    const isCorrect = submittedVal !== null && submittedVal.toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

    let scoreAwarded = 0;
    if (isCorrect) {
      scoreAwarded = qMarks;
      totalScore += qMarks;
      correctCount++;
    } else if (submittedVal !== null && q.negativeMarks) {
      totalScore = Math.max(0, totalScore - q.negativeMarks);
    }

    return {
      questionId: q.id,
      answer: submittedVal,
      isCorrect,
      scoreAwarded,
      marks: qMarks
    };
  }).filter(Boolean);

  const accuracy = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const updatedAttempt = store.update('quizAttempts', attempt.id, {
    answers: scoredAnswers,
    score: totalScore,
    maxScore,
    accuracy,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
    status: 'submitted',
    submittedAt: new Date().toISOString()
  });

  // Create in-app notification for the student
  store.create('notifications', {
    userId: req.user.id,
    type: 'quiz_completed',
    title: `Quiz Completed: ${quiz.title}`,
    body: `You scored ${totalScore}/${maxScore} (${accuracy}% accuracy). Click to review explanations.`,
    targetUrl: `/app/quiz-attempts/${attempt.id}/result`,
    isRead: false
  });

  res.json({ attempt: updatedAttempt });
});

// Student/Admin: View Quiz Attempt Result & Worked Explanations
router.get('/quiz-attempts/:id/result', authenticate, (req, res) => {
  const attempt = store.getById('quizAttempts', req.params.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

  if (req.user.role === 'student' && attempt.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const quiz = store.getById('quizzes', attempt.quizId);
  const allQuestions = store.get('questions');

  // Populate questions with solutions and explanations now that quiz is submitted!
  const questionsWithReview = (quiz?.questionRefs || []).map((ref) => {
    const q = allQuestions.find((item) => item.id === ref.questionId);
    if (!q) return null;

    const answerRecord = attempt.answers?.find((a) => a.questionId === q.id);

    return {
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options || [],
      difficulty: q.difficulty,
      marks: ref.marks || q.marks,
      studentAnswer: answerRecord ? answerRecord.answer : null,
      isCorrect: answerRecord ? answerRecord.isCorrect : false,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'Step-by-step solution available.'
    };
  }).filter(Boolean);

  res.json({
    attempt,
    quizTitle: quiz?.title || 'Quiz Result',
    questions: questionsWithReview
  });
});

// Admin: Create Quiz
router.post('/admin/quizzes', authenticate, requireRole('admin'), (req, res) => {
  const { title, description, subjectId, chapterIds, questionRefs, durationSeconds, attemptLimit, status } = req.body;

  if (!title || !subjectId || !Array.isArray(questionRefs) || questionRefs.length === 0) {
    return res.status(400).json({ error: 'Title, subject, and at least one question are required.' });
  }

  const newQuiz = store.create('quizzes', {
    title,
    description: description || '',
    subjectId,
    chapterIds: chapterIds || [],
    questionRefs,
    durationSeconds: parseInt(durationSeconds) || 600,
    attemptLimit: parseInt(attemptLimit) || 3,
    status: status || 'draft',
    createdBy: req.user.id
  });

  res.status(201).json({ quiz: newQuiz });
});

// Admin: Update Quiz
router.patch('/admin/quizzes/:id', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('quizzes', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Quiz not found.' });
  res.json({ quiz: updated });
});

// Admin: Publish Quiz
router.post('/admin/quizzes/:id/publish', authenticate, requireRole('admin'), (req, res) => {
  const updated = store.update('quizzes', req.params.id, { status: 'published' });
  if (!updated) return res.status(404).json({ error: 'Quiz not found.' });
  res.json({ quiz: updated });
});

// Admin: Delete Quiz
router.delete('/admin/quizzes/:id', authenticate, requireRole('admin'), (req, res) => {
  const deleted = store.delete('quizzes', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Quiz not found.' });
  res.json({ success: true, message: 'Quiz deleted.' });
});

export default router;
