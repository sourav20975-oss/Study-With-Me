import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  HelpCircle,
  Plus,
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Check,
  Clock,
  Sparkles,
  Maximize2,
  ThumbsUp,
  MessageSquare,
  GraduationCap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const SUBJECT_COLORS = {
  'Mathematics': 'bg-orange-100 text-orange-800 border-orange-200',
  'Science': 'bg-teal-100 text-teal-800 border-teal-200',
  'English': 'bg-amber-100 text-amber-800 border-amber-200',
  'Social Science': 'bg-sky-100 text-sky-800 border-sky-200'
};

const MATH_EQUATION_CHIPS = [
  { label: 'Fraction (a/b)', code: '$\\frac{a}{b}$' },
  { label: 'x²', code: '$x^2$' },
  { label: '√x', code: '$\\sqrt{x}$' },
  { label: '±', code: '$\\pm$' },
  { label: '×', code: '$\\times$' },
  { label: '÷', code: '$\\div$' },
  { label: 'π', code: '$\\pi$' },
  { label: '≤', code: '$\\le$' },
  { label: '≥', code: '$\\ge$' }
];

export function DoubtsView() {
  const [doubts, setDoubts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'answered' | 'pending'
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  // Modal / Form state
  const [isAsking, setIsAsking] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formChapter, setFormChapter] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState(null);

  // Local reaction states (e.g. marked as understood)
  const [understoodIds, setUnderstoodIds] = useState(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const [dRes, sRes] = await Promise.all([
          api.get('/doubts/mine'),
          api.get('/subjects')
        ]);
        setDoubts(dRes.doubts || []);
        setSubjects(sRes.subjects || []);
        if (sRes.subjects?.length > 0) {
          setFormSubject(sRes.subjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load doubts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update chapters when formSubject changes
  useEffect(() => {
    async function loadChapters() {
      if (!formSubject) return;
      try {
        const res = await api.get(`/subjects/${formSubject}/chapters`);
        setChapters(res.chapters || []);
        if (res.chapters?.length > 0) {
          setFormChapter(res.chapters[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadChapters();
  }, [formSubject]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.upload(file);
      setAttachment(res.url);
    } catch (err) {
      alert(err.message || 'Image upload failed. Please try a valid image file.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertMathChip = (code) => {
    setQuestionText((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + code + ' ');
  };

  const handleCreateDoubt = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert('Please enter your question details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/doubts', {
        subjectId: formSubject,
        chapterId: formChapter,
        questionText: questionText.trim(),
        attachments: attachment ? [attachment] : []
      });

      setDoubts((prev) => [res.doubt, ...prev]);
      setQuestionText('');
      setAttachment(null);
      setIsAsking(false);
    } catch (err) {
      alert(err.message || 'Failed to submit doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUnderstood = (id) => {
    setUnderstoodIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Doubts
  const filteredDoubts = useMemo(() => {
    return doubts.filter((d) => {
      // Status filter
      if (statusFilter === 'answered' && d.status !== 'answered') return false;
      if (statusFilter === 'pending' && d.status === 'answered') return false;

      // Subject filter
      if (selectedSubjectFilter !== 'all' && d.subjectId !== selectedSubjectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchQ = d.questionText?.toLowerCase().includes(q);
        const matchAns = d.answerText?.toLowerCase().includes(q);
        const matchSub = d.subjectName?.toLowerCase().includes(q);
        if (!matchQ && !matchAns && !matchSub) return false;
      }

      return true;
    });
  }, [doubts, statusFilter, selectedSubjectFilter, searchQuery]);

  const answeredCount = doubts.filter((d) => d.status === 'answered').length;
  const pendingCount = doubts.length - answeredCount;

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Loading your teacher doubts...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-teal-700/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/25">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>1-on-1 Tutor Desk</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 text-xs font-extrabold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse" />
                <span>Teacher Sourav Kumar Online</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ask Your Tutor & ICSE Board Doubt Desk
            </h1>

            <p className="text-xs sm:text-sm text-teal-50 font-medium leading-relaxed">
              Never stay stuck on tricky questions. Upload textbook photos or type math equations to get verified, step-by-step guidance.
            </p>
          </div>

          {/* Action & Stats Pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-5 flex items-center gap-4 text-white">
              <div>
                <span className="text-[10px] text-teal-100 font-bold uppercase tracking-wider block">
                  Resolved
                </span>
                <span className="text-xl sm:text-2xl font-black font-display leading-tight">
                  {answeredCount} / {doubts.length}
                </span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="text-[10px] text-teal-100 font-bold uppercase tracking-wider block">
                  In Queue
                </span>
                <span className="text-xl sm:text-2xl font-black font-display leading-tight text-amber-300">
                  {pendingCount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAsking(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ask New Doubt</span>
            </button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. FILTER & SEARCH CONTROLS
      ---------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doubts by concept, equation, or keyword..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({doubts.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('answered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'answered'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Answered ({answeredCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Queue ({pendingCount})
            </button>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-bold shrink-0">Subject:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
              selectedSubjectFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                selectedSubjectFilter === sub.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------
          3. DOUBTS LIST / CARDS
      ---------------------------------------------------- */}
      <div className="space-y-4 sm:space-y-6">
        {filteredDoubts.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              No doubts found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {doubts.length === 0
                ? "You haven't asked any doubts yet. Encountering a tough exercise step? Tap 'Ask New Doubt' to get step-by-step help."
                : "No inquiries matching your current filter. Try changing your search query or subject filters."}
            </p>
            {doubts.length === 0 && (
              <button
                type="button"
                onClick={() => setIsAsking(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ask Your First Question</span>
              </button>
            )}
          </div>
        ) : (
          filteredDoubts.map((doubt) => {
            const subjectBadge =
              SUBJECT_COLORS[doubt.subjectName] || 'bg-slate-100 text-slate-800 border-slate-200';
            const isUnderstood = understoodIds.has(doubt.id);

            return (
              <div
                key={doubt.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5 transition-all hover:border-slate-300"
              >
                {/* Header: Subject, Chapter & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${subjectBadge}`}
                    >
                      {doubt.subjectName || 'General Subject'}
                    </span>
                    {doubt.chapterTitle && (
                      <span className="text-xs font-bold text-slate-600">
                        · {doubt.chapterTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={doubt.status} />
                    <span className="text-[11px] text-slate-400 font-medium">
                      {doubt.createdAt
                        ? new Intl.DateTimeFormat('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          }).format(new Date(doubt.createdAt))
                        : ''}
                    </span>
                  </div>
                </div>

                {/* Question Body */}
                <div className="space-y-3">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    <MathRenderer content={doubt.questionText} />
                  </div>

                  {/* Attached photo thumbnail */}
                  {doubt.attachments && doubt.attachments.length > 0 && (
                    <div className="pt-1">
                      <div className="relative inline-block group rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                        <img
                          src={doubt.attachments[0]}
                          alt="Doubt attachment"
                          className="max-h-48 w-auto object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(doubt.attachments[0])}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1.5"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tutor's Response (if answered) */}
                {doubt.status === 'answered' && doubt.answerText ? (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-3 relative overflow-hidden">
                    {/* Tutor Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                          MS
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-xs font-extrabold text-slate-900">
                              {doubt.answeredBy || 'Sourav Kumar (Tutor)'}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified Solution</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Step-by-step ICSE Board breakdown
                          </span>
                        </div>
                      </div>

                      {doubt.answeredAt && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Intl.DateTimeFormat('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }).format(new Date(doubt.answeredAt))}
                        </span>
                      )}
                    </div>

                    {/* Formatted Solution Text with LaTeX Math */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                      <MathRenderer content={doubt.answerText} />
                    </div>

                    {/* Interactive Helpful Action */}
                    <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => toggleUnderstood(doubt.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isUnderstood
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{isUnderstood ? 'Marked as Understood! 🎉' : 'Mark as Understood'}</span>
                      </button>

                      <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
                        ✨ Solution verified by Class 8 Academic Faculty
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Pending Queue Notice */
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 animate-spin" />
                    </div>
                    <div>
                      <p className="font-bold">Your inquiry has been assigned to Tutor Sourav Kumar.</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        A step-by-step solution with diagrams/formulas will appear right here soon.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ----------------------------------------------------
          MODAL: ASK NEW DOUBT
      ---------------------------------------------------- */}
      {isAsking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateDoubt}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl my-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Ask Your Tutor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Get detailed step-by-step guidance on tough questions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAsking(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject & Chapter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chapter *
                </label>
                <select
                  value={formChapter}
                  onChange={(e) => setFormChapter(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Your Question or Tricky Step *
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  LaTeX Math supported ($...$)
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. In Linear Equations, I got confused in step 2 when transposing terms: 3(t - 3) = 5(2t + 1). Should I expand brackets first?"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-teal-500 transition-colors resize-none font-medium"
              />
            </div>

            {/* Quick Math Equation Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                Quick Formula Insert:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {MATH_EQUATION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertMathChip(chip.code)}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50 text-[11px] font-bold text-slate-700 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Attachment (Notebook Photo) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Attach Notebook / Textbook Photo (Optional)
              </label>

              {attachment ? (
                <div className="relative inline-block border border-slate-200 rounded-2xl p-1 bg-slate-50">
                  <img
                    src={attachment}
                    alt="Doubt attachment"
                    className="h-24 w-auto rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl text-xs font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50/40 cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span>
                    {uploadingImage ? 'Uploading via Cloudinary...' : 'Upload Image (PNG, JPG)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAsking(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Send Doubt to Tutor'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          LIGHTBOX MODAL FOR PHOTO PREVIEW
      ---------------------------------------------------- */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Full Preview"
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoubtsView;
