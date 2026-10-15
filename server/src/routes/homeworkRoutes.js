import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get Assignments (Students get published only, Admin gets all)
router.get('/assignments', authenticate, (req, res) => {
  let list = store.get('assignments') || [];
  if (req.user.role === 'student') {
    list = list.filter((a) => a.status === 'published');
  }

  const subjects = store.get('subjects') || [];
  const chapters = store.get('chapters') || [];
  const submissions = store.get('submissions') || [];

  const populated = list.map((asg) => {
    const sub = subjects.find((s) => s.id === asg.subjectId);
    const chap = chapters.find((c) => c.id === asg.chapterId);
    const studentSub = submissions.find((s) => s.assignmentId === asg.id && s.studentId === req.user.id);
    const allSubs = submissions.filter((s) => s.assignmentId === asg.id);
    const reviewedSubs = allSubs.filter((s) => s.status === 'reviewed');

    return {
      ...asg,
      totalMarks: asg.totalMarks || 10,
      subjectName: sub?.name || 'General',
      chapterTitle: chap?.title || 'Chapter',
      mySubmission: studentSub || null,
      submissionCount: allSubs.length,
      gradedCount: reviewedSubs.length
    };
  });

  res.json({ assignments: populated });
});

// Get Single Assignment Detail
router.get('/assignments/:id', authenticate, (req, res) => {
  const asg = store.getById('assignments', req.params.id);
  if (!asg) return res.status(404).json({ error: 'Assignment not found.' });

  const subject = store.getById('subjects', asg.subjectId);
  const chapter = store.getById('chapters', asg.chapterId);
  const mySubmission = store.findOne('submissions', (s) => s.assignmentId === asg.id && s.studentId === req.user.id);

  res.json({
    assignment: {
      ...asg,
      totalMarks: asg.totalMarks || 10,
      subjectName: subject?.name || 'General',
      chapterTitle: chapter?.title || 'Chapter'
    },
    submission: mySubmission
  });
});

// Student: Submit Homework
router.post('/assignments/:id/submissions', authenticate, requireRole('student'), (req, res) => {
  const asg = store.getById('assignments', req.params.id);
  if (!asg || asg.status !== 'published') {
    return res.status(404).json({ error: 'Assignment not available.' });
  }

  const { textAnswer, attachments = [] } = req.body;
  if (!textAnswer && attachments.length === 0) {
    return res.status(400).json({ error: 'Please provide either written answer text or attach work images.' });
  }

  const existing = store.findOne('submissions', (s) => s.assignmentId === asg.id && s.studentId === req.user.id);

  let submission;
  if (existing) {
    submission = store.update('submissions', existing.id, {
      textAnswer: textAnswer || '',
      attachments: Array.isArray(attachments) ? attachments : [attachments],
      status: 'submitted',
      submittedAt: new Date().toISOString()
    });
  } else {
    submission = store.create('submissions', {
      assignmentId: asg.id,
      studentId: req.user.id,
      textAnswer: textAnswer || '',
      attachments: Array.isArray(attachments) ? attachments : [attachments],
      status: 'submitted',
      score: null,
      feedback: '',
      submittedAt: new Date().toISOString()
    });
  }

  res.status(201).json({ submission });
});

// Admin: Create Assignment
router.post('/admin/assignments', authenticate, requireRole('admin'), (req, res) => {
  const { title, instructions, subjectId, chapterId, dueAt, attachments, status, totalMarks } = req.body;

  if (!title || !subjectId || !chapterId) {
    return res.status(400).json({ error: 'Title, subject, and chapter are required.' });
  }

  const newAsg = store.create('assignments', {
    title,
    instructions: instructions || '',
    subjectId,
    chapterId,
    totalMarks: parseInt(totalMarks) || 10,
    attachments: attachments || [],
    dueAt: dueAt || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: status || 'published',
    createdBy: req.user.id
  });

  res.status(201).json({ assignment: newAsg });
});

// Admin: Update Assignment
router.patch('/admin/assignments/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('assignments', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Assignment not found.' });

  const { title, instructions, subjectId, chapterId, dueAt, attachments, status, totalMarks } = req.body;

  const updated = store.update('assignments', req.params.id, {
    title: title !== undefined ? title : existing.title,
    instructions: instructions !== undefined ? instructions : existing.instructions,
    subjectId: subjectId !== undefined ? subjectId : existing.subjectId,
    chapterId: chapterId !== undefined ? chapterId : existing.chapterId,
    totalMarks: totalMarks !== undefined ? parseInt(totalMarks) || 10 : (existing.totalMarks || 10),
    dueAt: dueAt !== undefined ? dueAt : existing.dueAt,
    attachments: attachments !== undefined ? attachments : existing.attachments,
    status: status !== undefined ? status : existing.status
  });

  res.json({ assignment: updated });
});

// Admin: Delete Assignment
router.delete('/admin/assignments/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('assignments', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Assignment not found.' });

  // Delete all submissions for this assignment
  const allSubs = store.get('submissions') || [];
  const subsToDelete = allSubs.filter((s) => s.assignmentId === req.params.id);
  subsToDelete.forEach((s) => store.delete('submissions', s.id));

  // Delete assignment
  store.delete('assignments', req.params.id);

  res.json({ success: true, message: 'Assignment and associated submissions deleted successfully.' });
});

// Admin: Clone / Duplicate Assignment
router.post('/admin/assignments/:id/clone', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('assignments', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Assignment not found.' });

  const cloned = store.create('assignments', {
    title: `${existing.title} (Copy)`,
    instructions: existing.instructions,
    subjectId: existing.subjectId,
    chapterId: existing.chapterId,
    totalMarks: existing.totalMarks || 10,
    attachments: existing.attachments || [],
    dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'draft',
    createdBy: req.user.id
  });

  res.status(201).json({ assignment: cloned });
});

// Admin: Get Submissions (with filtering)
router.get('/admin/submissions', authenticate, requireRole('admin'), (req, res) => {
  const { status, assignmentId } = req.query;
  let submissions = store.get('submissions') || [];
  const assignments = store.get('assignments') || [];
  const users = store.get('users') || [];
  const subjects = store.get('subjects') || [];

  if (status && status !== 'all') {
    submissions = submissions.filter((s) => s.status === status);
  }
  if (assignmentId) {
    submissions = submissions.filter((s) => s.assignmentId === assignmentId);
  }

  const populated = submissions.map((sub) => {
    const asg = assignments.find((a) => a.id === sub.assignmentId);
    const student = users.find((u) => u.id === sub.studentId);
    const subject = asg ? subjects.find((s) => s.id === asg.subjectId) : null;

    return {
      ...sub,
      assignmentTitle: asg?.title || 'Assignment',
      totalMarks: asg?.totalMarks || 10,
      subjectName: subject?.name || 'General',
      studentName: student?.name || 'Aarav Sharma',
      studentEmail: student?.email || 'student@studysathi.com'
    };
  });

  res.json({ submissions: populated });
});

// Admin: Review / Grade Homework Submission
router.patch('/admin/submissions/:id/review', authenticate, requireRole('admin'), (req, res) => {
  const { score, feedback, status } = req.body;
  const existing = store.getById('submissions', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Submission not found.' });

  const asg = store.getById('assignments', existing.assignmentId);
  const totalMarks = asg?.totalMarks || 10;
  const parsedScore = score !== undefined ? parseFloat(score) : (existing.score ?? totalMarks);

  const updated = store.update('submissions', req.params.id, {
    score: parsedScore,
    feedback: feedback !== undefined ? feedback : existing.feedback,
    status: status || 'reviewed',
    reviewedAt: new Date().toISOString()
  });

  // Notify student of feedback
  store.create('notifications', {
    userId: existing.studentId,
    type: 'assignment_reviewed',
    title: `Homework Feedback: ${asg?.title || 'Assignment'}`,
    body: `Your tutor reviewed your homework (Score: ${parsedScore} / ${totalMarks}). Feedback: "${feedback ? feedback.slice(0, 80) : 'Checked'}"`,
    targetUrl: `/app/homework/${existing.assignmentId}`,
    isRead: false
  });

  res.json({ submission: updated });
});

// Admin: Reset Submission Grading
router.post('/admin/submissions/:id/reset', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('submissions', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Submission not found.' });

  const updated = store.update('submissions', req.params.id, {
    score: null,
    feedback: '',
    status: 'submitted',
    reviewedAt: null
  });

  res.json({ submission: updated });
});

// Admin: Delete Submission
router.delete('/admin/submissions/:id', authenticate, requireRole('admin'), (req, res) => {
  const existing = store.getById('submissions', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Submission not found.' });

  store.delete('submissions', req.params.id);
  res.json({ success: true, message: 'Submission deleted.' });
});

// Admin: Generate Demo Student Submission for quick evaluation testing
router.post('/admin/submissions/demo', authenticate, requireRole('admin'), (req, res) => {
  const { assignmentId } = req.body;
  const assignments = store.get('assignments') || [];
  const targetAsg = assignmentId ? assignments.find((a) => a.id === assignmentId) : assignments[0];
  if (!targetAsg) {
    return res.status(400).json({ error: 'Please create at least one assignment first.' });
  }

  const demoAnswers = [
    {
      text: "Step 1: Given algebraic identity applied: (5x + 3y)² = 25x² + 30xy + 9y².\nStep 2: Linear equation: 4(x - 2) = 3(x + 5) => 4x - 8 = 3x + 15 => x = 23.\nStep 3: Verified in tuition notebook. Workings neat and step-by-step.",
      att: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop"
    },
    {
      text: "1) Balanced equation: 2H₂ + O₂ → 2H₂O. 4 hydrogen and 2 oxygen atoms.\n2) CaCO₃ → CaO + CO₂ is already balanced.\n3) Osmosis diagram with semi-permeable membrane and vacuole labeled.",
      att: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop"
    }
  ];

  const pick = demoAnswers[Math.floor(Math.random() * demoAnswers.length)];

  const submission = store.create('submissions', {
    assignmentId: targetAsg.id,
    studentId: 'usr-student-1',
    textAnswer: pick.text,
    attachments: [pick.att],
    status: 'submitted',
    score: null,
    feedback: '',
    submittedAt: new Date().toISOString()
  });

  const subject = store.getById('subjects', targetAsg.subjectId);
  const student = store.getById('users', 'usr-student-1') || { name: 'Aarav Sharma', email: 'student@studysathi.com' };

  res.status(201).json({
    submission: {
      ...submission,
      assignmentTitle: targetAsg.title,
      totalMarks: targetAsg.totalMarks || targetAsg.maxMarks || 10,
      subjectName: subject?.name || 'General Curriculum',
      studentName: student.name,
      studentEmail: student.email
    }
  });
});

export default router;
