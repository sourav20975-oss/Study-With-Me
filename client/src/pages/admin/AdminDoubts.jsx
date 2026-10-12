import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  HelpCircle,
  Send,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  X,
  MessageSquare,
  Award,
  Upload,
  Check
} from 'lucide-react';

const SUBJECT_COLORS = {
  'sub-maths': 'bg-orange-100 text-orange-800 border-orange-200',
  'sub-science': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'sub-english': 'bg-amber-100 text-amber-800 border-amber-200',
  'sub-social': 'bg-teal-100 text-teal-800 border-teal-200'
};

const MATH_SHORTCUTS = [
  { label: 'Fraction (a/b)', insert: '$\\frac{a}{b}$' },
  { label: 'Equation (x =)', insert: '$x = $' },
  { label: 'Multiply (×)', insert: '$\\times$' },
  { label: 'Square (x²)', insert: '$x^2$' },
  { label: 'Step 1:', insert: '\n1. **Step 1:** ' },
  { label: 'Step 2:', insert: '\n2. **Step 2:** ' }
];

export function AdminDoubts() {
  const [doubts, setDoubts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'answered'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Answering Drawer / Modal state
  const [answeringDoubt, setAnsweringDoubt] = useState(null); // Doubt object
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  // Lightbox preview for attachments
  const [previewImage, setPreviewImage] = useState(null);

  const loadData = async () => {
    try {
      const [dRes, sRes] = await Promise.all([
        api.get('/admin/doubts'),
        api.get('/subjects')
      ]);
      setDoubts(dRes.doubts || []);
      setSubjects(sRes.subjects || []);
    } catch (e) {
      console.error('Failed to load doubts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Reply Modal
  const handleOpenReply = (doubt) => {
    setAnsweringDoubt(doubt);
    setAnswerText(doubt.answerText || '');
  };

  // Submit Answer
  const handleSendAnswer = async (e) => {
    e.preventDefault();
    if (!answeringDoubt || !answerText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/admin/doubts/${answeringDoubt.id}/answer`, {
        answerText: answerText.trim()
      });

      setDoubts((prev) =>
        prev.map((d) => (d.id === answeringDoubt.id ? { ...d, ...res.doubt } : d))
      );
      setAnsweringDoubt(null);
      setAnswerText('');
    } catch (err) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Assist: Draft Answer
  const handleDraftAIAnswer = async (doubtId) => {
    setIsDraftingAI(true);
    try {
      const res = await api.post(`/admin/doubts/${doubtId}/ai-answer`, {});
      if (res.suggestedAnswer) {
        setAnswerText(res.suggestedAnswer);
      }
    } catch (err) {
      alert(err.message || 'AI drafting failed. Please check connection.');
    } finally {
      setIsDraftingAI(false);
    }
  };

  // Delete Doubt
  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;
    try {
      await api.delete(`/admin/doubts/${doubtId}`);
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    } catch (err) {
      alert(err.message || 'Failed to delete doubt.');
    }
  };

  // Re-open Doubt (mark as pending)
  const handleReopenDoubt = async (doubtId) => {
    if (!window.confirm('Re-open this doubt and mark it as Pending?')) return;
    try {
      const res = await api.patch(`/admin/doubts/${doubtId}`, {
        status: 'pending'
      });
      setDoubts((prev) =>
        prev.map((d) => (d.id === doubtId ? { ...d, status: 'pending' } : d))
      );
    } catch (err) {
      alert(err.message || 'Failed to update doubt status.');
    }
  };

  // Insert formula shortcut
  const handleInsertShortcut = (textToInsert) => {
    setAnswerText((prev) => prev + textToInsert);
  };

  // Filtered doubts
  const filteredDoubts = doubts.filter((d) => {
    if (statusFilter === 'pending' && d.status !== 'pending') return false;
    if (statusFilter === 'answered' && d.status !== 'answered') return false;
    if (selectedSubject !== 'all' && d.subjectId !== selectedSubject) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = d.questionText?.toLowerCase().includes(q);
      const matchName = d.studentName?.toLowerCase().includes(q);
      const matchAns = d.answerText?.toLowerCase().includes(q);
      return matchText || matchName || matchAns;
    }
    return true;
  });

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const answeredCount = doubts.filter((d) => d.status === 'answered').length;

  if (loading) {
    return (
      <div className="py-16 text-center text-text-muted">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-semibold">Loading student doubts queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-accent" />
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Student Doubts & Explanations Queue
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Provide step-by-step guidance for student inquiries. Answered doubts notify the student immediately.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-xs font-semibold text-text-muted">Total Inquiries</div>
          <div className="text-2xl font-bold text-text mt-1">{doubts.length}</div>
          <div className="text-[11px] text-text-muted mt-0.5">Submitted by students</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-2xs ${
          pendingCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-surface border-border'
        }`}>
          <div className="text-xs font-semibold text-amber-700 flex items-center justify-between">
            <span>Pending Answers</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting tutor guidance</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700">Solved & Answered</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{answeredCount}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Student notified</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-muted mr-1">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-page border border-border text-text hover:bg-surface'
            }`}
          >
            All ({doubts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-page border border-border text-amber-700 hover:bg-amber-50'
            }`}
          >
            Needs Answer ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('answered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'answered'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-page border border-border text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Answered ({answeredCount})
          </button>
        </div>

        {/* Subject Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-page text-xs text-text font-bold"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search doubt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs bg-page text-text focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Doubts List */}
      {filteredDoubts.length === 0 ? (
        <div className="py-16 text-center text-text-muted bg-surface rounded-2xl border border-border p-6 space-y-2">
          <HelpCircle className="w-10 h-10 mx-auto text-text-muted/50 stroke-[1.5]" />
          <p className="text-sm font-semibold">No student doubts found.</p>
          <p className="text-xs text-text-muted">Students can ask questions with pictures from the Doubt Desk in their dashboard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((d) => {
            const isPending = d.status === 'pending';
            const subBadge = SUBJECT_COLORS[d.subjectId] || 'bg-slate-100 text-slate-800 border-slate-200';

            return (
              <div
                key={d.id}
                className={`bg-surface rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xs transition-all ${
                  isPending
                    ? 'border-amber-200/90 bg-amber-50/15'
                    : 'border-border'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-extrabold flex items-center justify-center text-xs shrink-0">
                      {d.studentName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text">{d.studentName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${subBadge}`}>
                          {d.subjectName}
                        </span>
                        <span className="text-[11px] text-text-muted font-medium">
                          {d.chapterTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted block mt-0.5">
                        Asked {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Answer</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Answered</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt with MathRenderer */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                    Student's Question:
                  </span>
                  <div className="p-3.5 rounded-xl bg-page border border-border text-xs sm:text-sm text-text leading-relaxed font-medium">
                    <MathRenderer content={d.questionText} />
                  </div>

                  {/* Student Attachments */}
                  {d.attachments && d.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {d.attachments.map((attUrl, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => setPreviewImage(attUrl)}
                          className="relative group rounded-xl overflow-hidden border border-border hover:border-accent shadow-2xs"
                        >
                          <img
                            src={attUrl}
                            alt="Doubt attachment"
                            className="h-24 w-24 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Zoom</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Published Answer Box */}
                {!isPending && d.answerText && (
                  <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Your Published Solution ({d.answeredBy || 'Sourav Kumar'}):</span>
                      </span>
                      {d.answeredAt && (
                        <span className="text-[11px] text-emerald-700">
                          {new Date(d.answeredAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="text-text leading-relaxed pt-1 space-y-1">
                      <MathRenderer content={d.answerText} />
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => handleReopenDoubt(d.id)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-muted hover:text-text hover:bg-page transition-colors flex items-center gap-1"
                        title="Mark back to pending"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-open</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDoubt(d.id)}
                      className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete doubt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Write / Edit Answer */}
                    <button
                      type="button"
                      onClick={() => handleOpenReply(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                        isPending
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-accent hover:bg-accent-hover text-white'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isPending ? 'Write Step-by-Step Answer' : 'Edit Solution'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANSWER / EXPLANATION MODAL */}
      {answeringDoubt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSendAnswer}
            className="bg-surface rounded-2xl border border-border p-6 max-w-xl w-full space-y-4 shadow-2xl my-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-text">
                  Answer {answeringDoubt.studentName}'s Doubt
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {answeringDoubt.subjectName} • {answeringDoubt.chapterTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAnsweringDoubt(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student's Question Preview */}
            <div className="p-3.5 rounded-xl bg-page border border-border text-xs text-text-muted leading-relaxed space-y-1">
              <span className="font-bold text-text text-[11px] block uppercase">Student asked:</span>
              <MathRenderer content={answeringDoubt.questionText} />
            </div>

            {/* AI Assistant Banner */}
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-purple-900 font-semibold">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Want AI to draft a step-by-step ICSE explanation?</span>
              </div>
              <button
                type="button"
                onClick={() => handleDraftAIAnswer(answeringDoubt.id)}
                disabled={isDraftingAI}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {isDraftingAI ? 'Drafting...' : '✨ Draft with AI'}
              </button>
            </div>

            {/* Math Formula Toolbar */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Quick Formula & Step Shortcuts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MATH_SHORTCUTS.map((sc, scIdx) => (
                  <button
                    key={scIdx}
                    type="button"
                    onClick={() => handleInsertShortcut(sc.insert)}
                    className="px-2 py-1 rounded-lg bg-page border border-border hover:border-accent text-[11px] text-text font-mono font-semibold"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solution Textarea */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Step-by-Step Worked Solution (Markdown & LaTeX formulas supported):
              </label>
              <textarea
                rows={8}
                required
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="1. Hello! First, let us expand the brackets on both sides:&#10;   3(t - 3) = 3t - 9&#10;   5(2t + 1) = 10t + 5&#10;2. Group like terms...&#10;3. Golden Rule: Always expand brackets first!"
                className="w-full p-3 border border-border rounded-xl text-xs bg-page text-text font-mono leading-relaxed focus:outline-none focus:border-accent"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setAnsweringDoubt(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !answerText.trim()}
                className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Solution to Student'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMAGE LIGHTBOX */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-surface rounded-2xl overflow-hidden border border-border flex flex-col shadow-2xl">
            <div className="p-3 bg-surface border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-text">Doubt Attachment</span>
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

export default AdminDoubts;
