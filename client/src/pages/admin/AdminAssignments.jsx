import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  FileCheck,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Eye,
  X,
  Upload,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  BookOpen,
  Award,
  AlertCircle,
  ExternalLink,
  Check,
  ChevronRight
} from 'lucide-react';

const SUBJECT_COLORS = {
  'sub-maths': 'bg-orange-100 text-orange-800 border-orange-200',
  'sub-science': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'sub-english': 'bg-amber-100 text-amber-800 border-amber-200',
  'sub-social': 'bg-teal-100 text-teal-800 border-teal-200'
};

const FEEDBACK_PRESETS = [
  '🌟 Excellent step-by-step working! Very neat and logical transposition.',
  '👍 Great attempt! Please re-check the calculation steps in the final answer.',
  '✏️ The logic is correct, but take care of sign changes when shifting terms across the equals sign.',
  '👏 Outstanding mathematical reasoning and crystal clear presentation.',
  '⚠️ Good effort, but please write all variable definitions and intermediate steps clearly.'
];

export function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'submissions' | 'assignments'
  const [activeTab, setActiveTab] = useState('submissions');

  // Search & Filter state
  const [subStatusFilter, setSubStatusFilter] = useState('all'); // 'all' | 'submitted' | 'reviewed'
  const [selectedAsgFilter, setSelectedAsgFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null); // Assignment object for edit modal
  const [gradingSub, setGradingSub] = useState(null); // Submission object for grading modal
  const [previewImage, setPreviewImage] = useState(null); // URL for image lightbox

  // Assignment Form State (used for both Create & Edit)
  const [asgForm, setAsgForm] = useState({
    title: '',
    subjectId: '',
    chapterId: '',
    totalMarks: 10,
    dueAt: '',
    instructions: '',
    status: 'published',
    attachments: []
  });
  const [isUploadingWorksheet, setIsUploadingWorksheet] = useState(false);
  const [isSavingAsg, setIsSavingAsg] = useState(false);

  // Grading Form State
  const [gradeScore, setGradeScore] = useState(10);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const loadData = async () => {
    try {
      const [asgRes, subRes, subListRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/admin/submissions'),
        api.get('/subjects')
      ]);

      setAssignments(asgRes.assignments || []);
      setSubmissions(subRes.submissions || []);
      setSubjects(subListRes.subjects || []);

      if (subListRes.subjects?.length > 0) {
        const firstSub = subListRes.subjects[0];
        const chapRes = await api.get(`/subjects/${firstSub.id}`);
        setChapters(chapRes.chapters || []);
      }
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When subject changes in form, update chapter list
  const handleSubjectChangeInForm = async (subId) => {
    setAsgForm((prev) => ({ ...prev, subjectId: subId, chapterId: '' }));
    try {
      const res = await api.get(`/subjects/${subId}`);
      setChapters(res.chapters || []);
      if (res.chapters?.length > 0) {
        setAsgForm((prev) => ({ ...prev, chapterId: res.chapters[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch chapters for subject:', err);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const defaultSubId = subjects[0]?.id || '';
    const defaultDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    setEditingAssignment(null);
    setAsgForm({
      title: '',
      subjectId: defaultSubId,
      chapterId: chapters[0]?.id || '',
      totalMarks: 10,
      dueAt: defaultDate,
      instructions: '',
      status: 'published',
      attachments: []
    });
    if (defaultSubId) {
      handleSubjectChangeInForm(defaultSubId);
    }
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (asg) => {
    setEditingAssignment(asg);
    const dueDateStr = asg.dueAt ? asg.dueAt.slice(0, 10) : '';

    setAsgForm({
      title: asg.title,
      subjectId: asg.subjectId,
      chapterId: asg.chapterId,
      totalMarks: asg.totalMarks || 10,
      dueAt: dueDateStr,
      instructions: asg.instructions || '',
      status: asg.status || 'published',
      attachments: asg.attachments || []
    });

    if (asg.subjectId) {
      try {
        const res = await api.get(`/subjects/${asg.subjectId}`);
        setChapters(res.chapters || []);
      } catch (err) {
        console.error(err);
      }
    }
    setShowCreateModal(true);
  };

  // Save Assignment (Create or Update)
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!asgForm.title.trim() || !asgForm.subjectId || !asgForm.chapterId) {
      alert('Please fill in title, subject, and chapter.');
      return;
    }

    setIsSavingAsg(true);
    try {
      const payload = {
        title: asgForm.title.trim(),
        subjectId: asgForm.subjectId,
        chapterId: asgForm.chapterId,
        totalMarks: parseInt(asgForm.totalMarks) || 10,
        dueAt: asgForm.dueAt ? new Date(asgForm.dueAt).toISOString() : new Date().toISOString(),
        instructions: asgForm.instructions.trim(),
        status: asgForm.status,
        attachments: asgForm.attachments || []
      };

      if (editingAssignment) {
        // UPDATE (CRUD: U)
        const res = await api.patch(`/admin/assignments/${editingAssignment.id}`, payload);
        setAssignments((prev) =>
          prev.map((a) => (a.id === editingAssignment.id ? { ...a, ...res.assignment } : a))
        );
      } else {
        // CREATE (CRUD: C)
        const res = await api.post('/admin/assignments', payload);
        setAssignments((prev) => [res.assignment, ...prev]);
      }

      setShowCreateModal(false);
      setEditingAssignment(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save assignment.');
    } finally {
      setIsSavingAsg(false);
    }
  };

  // Delete Assignment (CRUD: D)
  const handleDeleteAssignment = async (asgId, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment: "${title}"?\nAll associated student submissions will also be deleted.`)) {
      return;
    }

    try {
      await api.delete(`/admin/assignments/${asgId}`);
      setAssignments((prev) => prev.filter((a) => a.id !== asgId));
      setSubmissions((prev) => prev.filter((s) => s.assignmentId !== asgId));
    } catch (err) {
      alert(err.message || 'Failed to delete assignment.');
    }
  };

  // Clone Assignment
  const handleCloneAssignment = async (asgId) => {
    try {
      const res = await api.post(`/admin/assignments/${asgId}/clone`, {});
      setAssignments((prev) => [res.assignment, ...prev]);
      alert('Assignment cloned as Draft! You can edit and publish it.');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to duplicate assignment.');
    }
  };

  // Toggle Assignment Status (Publish / Draft)
  const handleToggleStatus = async (asg) => {
    const nextStatus = asg.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.patch(`/admin/assignments/${asg.id}`, { status: nextStatus });
      setAssignments((prev) =>
        prev.map((a) => (a.id === asg.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  // Upload worksheet attachment
  const handleWorksheetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWorksheet(true);
    try {
      const res = await api.upload(file);
      setAsgForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), res.url]
      }));
    } catch (err) {
      alert(err.message || 'Worksheet upload failed.');
    } finally {
      setIsUploadingWorksheet(false);
    }
  };

  // Remove attachment from form
  const handleRemoveAttachment = (urlToRemove) => {
    setAsgForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((u) => u !== urlToRemove)
    }));
  };

  // Open Grading Modal
  const handleOpenGradingModal = (sub) => {
    setGradingSub(sub);
    const maxM = sub.totalMarks || 10;
    setGradeScore(sub.score !== null ? sub.score : maxM);
    setGradeFeedback(sub.feedback || 'Well attempted! Neat step-by-step working.');
  };

  // Save Grade (CRUD: C/U for Grading)
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;

    setIsSavingGrade(true);
    try {
      const res = await api.patch(`/admin/submissions/${gradingSub.id}/review`, {
        score: parseFloat(gradeScore),
        feedback: gradeFeedback.trim(),
        status: 'reviewed'
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === gradingSub.id ? { ...s, ...res.submission } : s))
      );
      setGradingSub(null);
    } catch (err) {
      alert(err.message || 'Failed to save evaluation.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Reset Grade (CRUD: Reset to submitted)
  const handleResetGrade = async (subId) => {
    if (!window.confirm('Reset this submission back to Pending Evaluation?')) return;
    try {
      const res = await api.post(`/admin/submissions/${subId}/reset`, {});
      setSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, ...res.submission } : s))
      );
    } catch (err) {
      alert(err.message || 'Failed to reset grade.');
    }
  };

  // Delete Submission (CRUD: D)
  const handleDeleteSubmission = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      await api.delete(`/admin/submissions/${subId}`);
      setSubmissions((prev) => prev.filter((s) => s.id !== subId));
    } catch (err) {
      alert(err.message || 'Failed to delete submission.');
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (subStatusFilter === 'submitted' && sub.status !== 'submitted') return false;
    if (subStatusFilter === 'reviewed' && sub.status !== 'reviewed') return false;
    if (selectedAsgFilter !== 'all' && sub.assignmentId !== selectedAsgFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.studentName?.toLowerCase().includes(q);
      const matchTitle = sub.assignmentTitle?.toLowerCase().includes(q);
      const matchText = sub.textAnswer?.toLowerCase().includes(q);
      return matchName || matchTitle || matchText;
    }
    return true;
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((asg) => {
    if (searchQuery.trim() && activeTab === 'assignments') {
      const q = searchQuery.toLowerCase();
      return asg.title?.toLowerCase().includes(q) ||
             asg.instructions?.toLowerCase().includes(q) ||
             asg.subjectName?.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const reviewedCount = submissions.filter((s) => s.status === 'reviewed').length;

  if (loading) {
    return (
      <div className="py-16 text-center text-text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-semibold">Loading Homework Workbench...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Homework & Student Submissions
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Assign written problem sets, evaluate student workings, and leave structured tutor feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Homework Assignment</span>
        </button>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-xs font-semibold text-text-muted">Total Assignments</div>
          <div className="text-2xl font-bold text-text mt-1">{assignments.length}</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {assignments.filter((a) => a.status === 'published').length} published active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-xs font-semibold text-text-muted">Total Submissions</div>
          <div className="text-2xl font-bold text-text mt-1">{submissions.length}</div>
          <div className="text-[11px] text-text-muted mt-0.5">From Class 8 students</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          pendingCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-surface border-border'
        }`}>
          <div className="text-xs font-semibold text-amber-700 flex items-center justify-between">
            <span>Needs Grading</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting evaluation</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700">Graded & Feedback</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{reviewedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Evaluated by you</div>
        </div>
      </div>

      {/* Tabs & Search / Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'submissions'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-page border border-border text-text hover:bg-surface'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Student Submissions ({submissions.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-accent text-white shadow-xs'
                : 'bg-page border border-border text-text hover:bg-surface'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Published Assignments ({assignments.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={activeTab === 'submissions' ? 'Search student or title...' : 'Search assignments...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border text-xs bg-page text-text focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* TAB 1: SUBMISSIONS & GRADING QUEUE */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface p-3 rounded-xl border border-border text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted font-semibold mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setSubStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  subStatusFilter === 'all'
                    ? 'bg-accent text-white'
                    : 'bg-page border border-border text-text hover:bg-surface'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setSubStatusFilter('submitted')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  subStatusFilter === 'submitted'
                    ? 'bg-amber-600 text-white'
                    : 'bg-page border border-border text-amber-700 hover:bg-amber-50'
                }`}
              >
                Needs Grading ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setSubStatusFilter('reviewed')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  subStatusFilter === 'reviewed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-page border border-border text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Graded ({reviewedCount})
              </button>
            </div>

            {/* Assignment filter dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted font-semibold">Assignment:</span>
              <select
                value={selectedAsgFilter}
                onChange={(e) => setSelectedAsgFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-border bg-page text-xs text-text font-medium"
              >
                <option value="all">All Assignments</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center text-text-muted bg-surface rounded-xl border border-border p-6 space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-text-muted/50 stroke-[1.5]" />
              <p className="text-sm font-semibold">No homework submissions found matching the filter.</p>
              <p className="text-xs text-text-muted">Students will see assigned worksheets and submit their step-by-step notebook pictures here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const isReviewed = sub.status === 'reviewed';
                const maxMarks = sub.totalMarks || 10;
                const scorePercent = sub.score !== null ? Math.round((sub.score / maxMarks) * 100) : null;

                return (
                  <div
                    key={sub.id}
                    className={`bg-surface rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xs transition-all ${
                      !isReviewed
                        ? 'border-amber-200/90 bg-amber-50/20'
                        : 'border-border'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-xs">
                            {sub.studentName?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-text">
                              {sub.studentName || 'Aarav Sharma'}
                            </h3>
                            <div className="text-[11px] text-text-muted flex items-center gap-2">
                              <span>{sub.assignmentTitle}</span>
                              <span>•</span>
                              <span>
                                Submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReviewed ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Graded ({sub.score}/{maxMarks})</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Evaluation</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student Solution Text */}
                    {sub.textAnswer && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                          Student Written Work:
                        </span>
                        <div className="text-xs sm:text-sm font-mono whitespace-pre-line bg-page p-4 rounded-xl border border-border leading-relaxed text-text">
                          <MathRenderer content={sub.textAnswer} />
                        </div>
                      </div>
                    )}

                    {/* Student Attachments (Notebook Photos) */}
                    {sub.attachments && sub.attachments.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                          Uploaded Homework Pages ({sub.attachments.length}):
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {sub.attachments.map((attUrl, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => setPreviewImage(attUrl)}
                              className="relative group rounded-xl overflow-hidden border border-border hover:border-accent shadow-2xs transition-all"
                            >
                              <img
                                src={attUrl}
                                alt={`Homework page ${aIdx + 1}`}
                                className="h-28 w-28 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tutor Evaluation Section (if Reviewed) */}
                    {isReviewed && (
                      <div className="p-4 rounded-xl bg-surface border border-emerald-200/80 bg-emerald-50/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>Tutor Evaluation & Score:</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                              {sub.score} / {maxMarks} Marks ({scorePercent}%)
                            </span>
                          </div>
                        </div>
                        <p className="text-text italic bg-white/70 p-3 rounded-lg border border-emerald-100/80">
                          "{sub.feedback}"
                        </p>
                      </div>
                    )}

                    {/* Action Buttons: Grade, Reset, Delete */}
                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isReviewed && (
                          <button
                            type="button"
                            onClick={() => handleResetGrade(sub.id)}
                            className="px-3 py-1.5 rounded-lg border border-border hover:bg-page text-text-muted hover:text-text text-xs font-semibold transition-colors flex items-center gap-1.5"
                            title="Reset grade to un-evaluated"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Grade</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id)}
                          className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenGradingModal(sub)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                          !isReviewed
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-accent hover:bg-accent-hover text-white'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>{isReviewed ? 'Update Grade & Feedback' : 'Grade & Add Feedback'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLISHED ASSIGNMENTS (FULL CRUD) */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="py-16 text-center text-text-muted bg-surface rounded-xl border border-border p-6 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-text-muted/50 stroke-[1.5]" />
              <p className="text-sm font-semibold">No homework assignments created yet.</p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Assignment</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((asg) => {
                const subBadge = SUBJECT_COLORS[asg.subjectId] || 'bg-slate-100 text-slate-800 border-slate-200';
                const dueDateStr = asg.dueAt
                  ? new Date(asg.dueAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Open';

                return (
                  <div
                    key={asg.id}
                    className="bg-surface rounded-2xl border border-border p-5 flex flex-col justify-between shadow-2xs hover:border-accent/40 transition-all space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${subBadge}`}>
                            {asg.subjectName}
                          </span>
                          <span className="text-[11px] font-semibold text-text-muted">
                            {asg.chapterTitle}
                          </span>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(asg)}
                          title="Click to toggle status"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                            asg.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {asg.status === 'published' ? '● Published' : '○ Draft'}
                        </button>
                      </div>

                      {/* Title & Instructions */}
                      <h3 className="font-bold text-base sm:text-lg text-text leading-snug">
                        {asg.title}
                      </h3>

                      <div className="text-xs text-text-muted line-clamp-3 mt-2 font-mono bg-page p-2.5 rounded-lg border border-border">
                        <MathRenderer content={asg.instructions} />
                      </div>

                      {/* Attachments (Worksheet) */}
                      {asg.attachments && asg.attachments.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[11px] text-text-muted font-semibold">Worksheet Image:</span>
                          <button
                            type="button"
                            onClick={() => setPreviewImage(asg.attachments[0])}
                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Worksheet</span>
                          </button>
                        </div>
                      )}

                      {/* Meta stats */}
                      <div className="flex items-center gap-3 text-xs text-text-muted pt-3 border-t border-border mt-3">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {dueDateStr}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-accent">
                          Max Marks: {asg.totalMarks || 10}
                        </span>
                        <span>•</span>
                        <span>
                          Submissions: {asg.submissionCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions: Edit, Clone, Delete */}
                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAsgFilter(asg.id);
                          setActiveTab('submissions');
                        }}
                        className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                      >
                        <span>View Submissions ({asg.submissionCount || 0})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCloneAssignment(asg.id)}
                          className="p-1.5 text-text-muted hover:text-accent hover:bg-page rounded-lg transition-colors"
                          title="Duplicate assignment"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(asg)}
                          className="p-1.5 text-text-muted hover:text-accent hover:bg-page rounded-lg transition-colors"
                          title="Edit assignment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(asg.id, asg.title)}
                          className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveAssignment}
            className="bg-surface rounded-2xl border border-border p-6 max-w-xl w-full space-y-4 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-text">
                {editingAssignment ? 'Edit Homework Assignment' : 'Create Homework Assignment'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">Assignment Title *</label>
              <input
                type="text"
                required
                value={asgForm.title}
                onChange={(e) => setAsgForm({ ...asgForm, title: e.target.value })}
                placeholder="e.g. Linear Equations Word Problems Practice Worksheet"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium focus:outline-none focus:border-accent"
              />
            </div>

            {/* Subject & Chapter Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Subject *</label>
                <select
                  value={asgForm.subjectId}
                  onChange={(e) => handleSubjectChangeInForm(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Chapter *</label>
                <select
                  value={asgForm.chapterId}
                  onChange={(e) => setAsgForm({ ...asgForm, chapterId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-medium"
                >
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marks & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Total Marks</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={asgForm.totalMarks}
                  onChange={(e) => setAsgForm({ ...asgForm, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={asgForm.dueAt}
                  onChange={(e) => setAsgForm({ ...asgForm, dueAt: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Status</label>
                <select
                  value={asgForm.status}
                  onChange={(e) => setAsgForm({ ...asgForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  <option value="published">Published (Visible to Students)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Worksheet Questions & Instructions */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Worksheet Questions & Problem Instructions:
              </label>
              <textarea
                rows={5}
                required
                value={asgForm.instructions}
                onChange={(e) => setAsgForm({ ...asgForm, instructions: e.target.value })}
                placeholder="1) Solve the following step-by-step: 2x + 7 = 15...&#10;2) Baichung's father is 26 years younger...&#10;3) Find two consecutive even numbers whose sum is 98."
                className="w-full p-3 border border-border rounded-xl text-xs bg-page text-text font-mono leading-relaxed focus:outline-none focus:border-accent"
              />
            </div>

            {/* Optional Worksheet Attachments */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text">
                Worksheet Image / Question Diagram (Optional):
              </label>

              {asgForm.attachments && asgForm.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asgForm.attachments.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={url} alt="Attachment" className="h-16 w-16 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(url)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-border hover:border-accent text-xs font-semibold cursor-pointer text-text hover:bg-page transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingWorksheet ? 'Uploading...' : '+ Upload Question Paper / Diagram'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleWorksheetUpload}
                  disabled={isUploadingWorksheet}
                  className="hidden"
                />
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAsg || isUploadingWorksheet}
                className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSavingAsg ? 'Saving...' : editingAssignment ? 'Update Assignment' : 'Publish Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GRADING & FEEDBACK MODAL */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveGrade}
            className="bg-surface rounded-2xl border border-border p-6 max-w-lg w-full space-y-4 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-text">
                  Evaluate & Grade Homework
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Student: <span className="font-bold text-text">{gradingSub.studentName}</span> • {gradingSub.assignmentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Input & Quick Score Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text">
                  Score awarded (out of {gradingSub.totalMarks || 10}):
                </label>
                <span className="text-xs font-extrabold text-accent">
                  {Math.round(((parseFloat(gradeScore) || 0) / (gradingSub.totalMarks || 10)) * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={gradingSub.totalMarks || 10}
                  step={0.5}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-28 px-3 py-2 border border-border rounded-xl text-base font-extrabold bg-page text-text focus:outline-none focus:border-accent"
                />

                {/* Quick Score Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[100, 90, 80, 70, 50].map((pct) => {
                    const maxM = gradingSub.totalMarks || 10;
                    const val = (maxM * pct) / 100;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setGradeScore(val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          parseFloat(gradeScore) === val
                            ? 'bg-accent text-white border-accent'
                            : 'bg-page border-border text-text-muted hover:text-text'
                        }`}
                      >
                        {pct}% ({val})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Feedback Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Quick Feedback Templates:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setGradeFeedback(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-page border border-border hover:border-accent text-slate-700 hover:text-accent font-medium text-left transition-colors"
                  >
                    {preset.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Constructive Tutor Feedback & Guidance:
              </label>
              <textarea
                rows={4}
                required
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Praise neat presentation, highlight algebra transposition slips, encourage step writing..."
                className="w-full p-3 border border-border rounded-xl text-xs bg-page text-text leading-relaxed focus:outline-none focus:border-accent"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingGrade}
                className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover active:scale-95 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSavingGrade ? 'Saving Grade...' : 'Save & Publish Evaluation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMAGE LIGHTBOX PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden border border-border flex flex-col shadow-2xl">
            <div className="p-3 bg-surface border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-text">Attachment Preview</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-black/90">
              <img
                src={previewImage}
                alt="Enlarged view"
                className="max-h-[75vh] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAssignments;
