import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle,
  Clock,
  Calendar,
  Share2,
  FileQuestion,
  Sparkles,
  HelpCircle,
  Check,
  BookOpen,
  GraduationCap,
  ListTree,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

const SUBJECT_COLORS = {
  'Mathematics': {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    accent: 'text-orange-600',
    border: 'border-orange-500',
    bg: 'bg-orange-50/70',
    banner: 'from-orange-500 to-amber-500',
  },
  'Science': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accent: 'text-emerald-600',
    border: 'border-emerald-500',
    bg: 'bg-emerald-50/70',
    banner: 'from-emerald-600 to-teal-600',
  },
  'English': {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    accent: 'text-amber-600',
    border: 'border-amber-500',
    bg: 'bg-amber-50/70',
    banner: 'from-amber-500 to-yellow-600',
  },
  'Social Science': {
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    accent: 'text-teal-600',
    border: 'border-teal-500',
    bg: 'bg-teal-50/70',
    banner: 'from-teal-600 to-cyan-600',
  }
};

export function NotesReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.note);

        const bmRes = await api.get('/student/bookmarks');
        const bookmarked = (bmRes.bookmarks || []).some((b) => b.targetId === id);
        setIsBookmarked(bookmarked);
      } catch (err) {
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [id]);

  const toggleBookmark = async () => {
    try {
      const res = await api.post('/student/bookmarks', {
        targetType: 'note',
        targetId: id
      });
      setIsBookmarked(res.bookmarked);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Extract headings from note content for "Chapter Quick Outline"
  const headings = useMemo(() => {
    if (!note?.contentHtml) return [];
    const text = String(note.contentHtml);
    const matches = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        level: match[1].length,
        title: match[2].trim()
      });
    }
    return matches;
  }, [note?.contentHtml]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold">Opening study notebook...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200">
        <p className="text-base font-bold text-slate-800">Study note not found or unavailable.</p>
        <Link
          to="/app/subjects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Syllabus</span>
        </Link>
      </div>
    );
  }

  const subTheme = SUBJECT_COLORS[note.subjectName] || {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    accent: 'text-orange-600',
    border: 'border-orange-500',
    bg: 'bg-orange-50/70',
    banner: 'from-orange-500 to-amber-500'
  };

  const pubDate = note.publishedAt
    ? new Date(note.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Recently';

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-150">
      {/* 1. Top Navigation & Action Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/app/subjects/${note.subjectId}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>{note.subjectName}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">{note.chapterTitle}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isBookmarked
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Bookmark this note"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
          </button>

          {/* Mark Reviewed */}
          <button
            onClick={() => setIsReviewed(!isReviewed)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isReviewed
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${isReviewed ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{isReviewed ? 'Completed' : 'Mark Done'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors relative"
            title="Copy Note Link"
          >
            <Share2 className="w-4 h-4" />
            {copiedLink && (
              <span className="absolute -top-8 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                Link copied!
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Deck: Left (Reading Content) & Right (Companion Desk) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* ========================================================================= */}
        {/* Main Reading Article (8 cols on desktop) */}
        {/* ========================================================================= */}
        <article className="lg:col-span-8 space-y-6">
          {/* Note Hero Card */}
          <header className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${subTheme.badge}`}
              >
                {note.subjectName} · {note.chapterTitle}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>{note.readTimeMinutes} min read</span>
              </span>

              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published {pubDate}</span>
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 ml-auto">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tutor Verified</span>
              </span>
            </div>

            {/* Note Title */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
              {note.title}
            </h1>

            {/* Editorial Summary Card */}
            {note.summary && (
              <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/80 border-l-4 border-orange-500 text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-extrabold text-orange-800 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Core Takeaway & Concept Overview</span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-slate-700 font-medium">
                  {note.summary}
                </p>
              </div>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Main Reading Content Body */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
            <MathRenderer content={note.contentHtml} />
          </div>

          {/* Post-Reading Milestone Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-white shadow-fun flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-extrabold mb-1">
                <Award className="w-4 h-4 fill-current" />
                <span>Reading Goal Achieved!</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black">
                Ready to practice questions?
              </h3>
              <p className="text-xs sm:text-sm text-orange-50 font-medium max-w-md">
                Cement your understanding of {note.title} with step-by-step Class 8 quiz practice.
              </p>
            </div>

            <Link
              to="/app/quizzes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-sm transition-all shadow-md shrink-0 active:scale-95"
            >
              <FileQuestion className="w-4 h-4 stroke-[2.5]" />
              <span>Practice Questions Now →</span>
            </Link>
          </div>
        </article>

        {/* ========================================================================= */}
        {/* Right Sticky Companion Desk (4 cols on desktop) */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-4 space-y-6 sticky top-20">
          {/* Chapter Quick Outline */}
          {headings.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ListTree className="w-4 h-4 text-orange-500" />
                <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider">
                  In This Chapter
                </h3>
              </div>

              <div className="space-y-2">
                {headings.map((h, idx) => (
                  <div
                    key={idx}
                    className={`text-xs font-medium text-slate-700 hover:text-orange-600 transition-colors flex items-start gap-2 ${
                      h.level === 1
                        ? 'font-bold text-slate-900'
                        : h.level === 2
                        ? 'pl-3 text-slate-600'
                        : 'pl-6 text-slate-500'
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{h.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doubt Desk Shortcut Card */}
          <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-xs space-y-3 bg-teal-50/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Have a Doubt in this Note?
                </h3>
                <p className="text-[11px] text-slate-500">Ask your tutor with a photo or question</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If any formula or diagram seems unclear, upload a photo or write your question. Your teacher will solve it step-by-step.
            </p>

            <Link
              to={`/app/doubts?subjectId=${note.subjectId}&chapterId=${note.chapterId}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Tutor a Doubt</span>
            </Link>
          </div>

          {/* Study Streak Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500 fill-current" />
                <span className="font-display text-sm font-extrabold text-slate-900">
                  Daily Study Streak
                </span>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                3 Days Active 🔥
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Reading chapter notes builds conceptual depth. Keep learning daily to unlock Class 8 mastery badges!
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold">Next Subject:</span>
              <Link to="/app/subjects" className="font-bold text-orange-600 hover:underline">
                Explore Syllabus →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
