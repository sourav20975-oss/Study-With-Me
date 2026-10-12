import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  RotateCcw,
  Bookmark,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Search,
  Check,
  X,
  Target,
  Trophy,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Clock,
  Trash2,
  FolderHeart
} from 'lucide-react';

const SUBJECT_COLORS = {
  'Mathematics': 'bg-orange-100 text-orange-800 border-orange-200',
  'Science': 'bg-teal-100 text-teal-800 border-teal-200',
  'English': 'bg-amber-100 text-amber-800 border-amber-200',
  'Social Science': 'bg-sky-100 text-sky-800 border-sky-200'
};

export function RevisionNotebook() {
  const navigate = useNavigate();
  const location = useLocation();

  const isBookmarksRoute = location.pathname.includes('/bookmarks');
  const [activeTab, setActiveTab] = useState(isBookmarksRoute ? 'bookmarks' : 'mistakes');

  const [mistakes, setMistakes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Sync tab with URL route changes (e.g. sidebar navigation)
  useEffect(() => {
    if (location.pathname.includes('/bookmarks')) {
      setActiveTab('bookmarks');
    } else if (location.pathname.includes('/revision')) {
      setActiveTab('mistakes');
    }
  }, [location.pathname]);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, bRes] = await Promise.all([
          api.get('/student/revision'),
          api.get('/student/bookmarks')
        ]);
        setMistakes(mRes.mistakes || []);
        setBookmarks(bRes.bookmarks || []);
      } catch (err) {
        console.error('Failed to load revision data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookmarks') {
      navigate('/app/bookmarks');
    } else {
      navigate('/app/revision');
    }
  };

  // Remove bookmark
  const handleRemoveBookmark = async (targetId) => {
    try {
      await api.post('/student/bookmarks', { targetType: 'note', targetId });
      setBookmarks((prev) => prev.filter((b) => b.targetId !== targetId));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle mastered status for a mistake
  const toggleMastered = (id) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Ask tutor about specific mistake
  const handleAskTutor = (mistake) => {
    navigate('/app/doubts', {
      state: {
        prefillQuestion: `In ${mistake.subjectName} (${mistake.chapterTitle}), I made a mistake on: "${mistake.prompt}". Could you help explain the step-by-step logic?`
      }
    });
  };

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (subjectFilter !== 'all' && m.subjectName !== subjectFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPrompt = m.prompt?.toLowerCase().includes(q);
        const matchChap = m.chapterTitle?.toLowerCase().includes(q);
        const matchExpl = m.explanation?.toLowerCase().includes(q);
        if (!matchPrompt && !matchChap && !matchExpl) return false;
      }
      return true;
    });
  }, [mistakes, subjectFilter, searchQuery]);

  // Unique subjects in mistakes
  const availableSubjects = useMemo(() => {
    const set = new Set();
    mistakes.forEach((m) => {
      if (m.subjectName) set.add(m.subjectName);
    });
    return Array.from(set);
  }, [mistakes]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Loading your revision materials...</p>
      </div>
    );
  }

  const isShowingBookmarks = activeTab === 'bookmarks';

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER (Adapts dynamically to Tab)
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-purple-900 via-indigo-800 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-900/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/25">
                {isShowingBookmarks ? (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                    <span>Saved Chapters & Notes</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                    <span>Smart Revision Companion</span>
                  </>
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-xs">
                <span>
                  {isShowingBookmarks
                    ? 'Class 8 ICSE Pinned Library 📚'
                    : 'Turn Mistakes into Top Marks 🎯'}
                </span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {isShowingBookmarks ? 'Saved Chapters & Library' : 'Revision & Mistakes Notebook'}
            </h1>

            <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
              {isShowingBookmarks
                ? 'Quick revision access to your bookmarked ICSE Class 8 syllabus chapters, core concept notes, and formula sheets.'
                : 'Targeted review of questions you missed during practice quizzes, paired with verified ICSE Board solutions.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Saved Notes
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-amber-300">
                {bookmarks.length} Chapters
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Missed Qs
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-white">
                {mistakes.length} Questions
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">
                Mastered
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-emerald-300">
                {masteredIds.size} Solved
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. NAVIGATION TABS & FILTER BAR
      ---------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
            <button
              type="button"
              onClick={() => handleTabChange('bookmarks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-white text-purple-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Chapters ({bookmarks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('mistakes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'mistakes'
                  ? 'bg-white text-purple-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mistake Notebook ({mistakes.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or formulas..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Subject Filter Chips (Only for mistakes tab) */}
        {activeTab === 'mistakes' && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">Subject:</span>
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                subjectFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Subjects
            </button>
            {availableSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                  subjectFilter === sub
                    ? 'bg-purple-800 text-white border-purple-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------
          3. CONTENT: SAVED CHAPTERS OR MISTAKES
      ---------------------------------------------------- */}
      {isShowingBookmarks ? (
        /* SAVED CHAPTERS TAB */
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-200 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Bookmark className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                No saved chapters yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                While studying any chapter in your syllabus library, click the bookmark icon to save it here for fast pre-exam revision.
              </p>
              <Link
                to="/app/subjects"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Browse Syllabus Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-purple-300 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        Saved ICSE Note
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(b.targetId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from saved chapters"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-purple-700 transition-colors leading-snug">
                      {b.target?.title || 'Bookmarked Chapter Note'}
                    </h4>

                    {b.target?.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {b.target.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      {b.target?.readTimeMinutes || 7} min read
                    </span>

                    <Link
                      to={`/app/notes/${b.targetId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-xs"
                    >
                      <span>Read Chapter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MISTAKES NOTEBOOK TAB */
        <div className="space-y-4 sm:space-y-6">
          {filteredMistakes.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-200 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">
                {mistakes.length === 0
                  ? 'Zero mistakes recorded! Outstanding work!'
                  : 'No questions match your current filter.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {mistakes.length === 0
                  ? 'As you attempt chapter practice quizzes, any incorrect steps will automatically be archived here for targeted formula review.'
                  : 'Try selecting a different subject or clearing your search term.'}
              </p>
            </div>
          ) : (
            filteredMistakes.map((m) => {
              const subColor =
                SUBJECT_COLORS[m.subjectName] || 'bg-slate-100 text-slate-800 border-slate-200';
              const isMastered = masteredIds.has(m.id);

              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 space-y-4 shadow-xs ${
                    isMastered
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200/90 hover:border-purple-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${subColor}`}
                      >
                        {m.subjectName || 'Subject'}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        · {m.chapterTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMastered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Mastered Concept</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                    <MathRenderer content={m.prompt} />
                  </div>

                  {/* Worked Solution & Concept Breakdown */}
                  {m.explanation && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified ICSE Board Worked Solution & Concept:</span>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                        <MathRenderer content={m.explanation} />
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleMastered(m.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isMastered ? 'Marked as Mastered! 🎉' : 'Mark as Mastered'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAskTutor(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Ask Tutor About This Question →</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default RevisionNotebook;
