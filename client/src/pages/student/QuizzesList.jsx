import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  CheckSquare,
  Clock,
  ArrowRight,
  Award,
  RefreshCw,
  AlertCircle,
  Trophy,
  Sparkles,
  Search,
  CheckCircle2,
  Flame,
  Star,
  Timer,
  BookOpen,
  Filter
} from 'lucide-react';

const SUBJECT_COLORS = {
  'Mathematics': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    border: 'border-orange-200 hover:border-orange-400',
    btn: 'bg-orange-500 hover:bg-orange-600'
  },
  'Science': {
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    border: 'border-teal-200 hover:border-teal-400',
    btn: 'bg-teal-600 hover:bg-teal-700'
  },
  'English': {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    border: 'border-amber-200 hover:border-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-700'
  },
  'Social Science': {
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    border: 'border-sky-200 hover:border-sky-400',
    btn: 'bg-sky-600 hover:bg-sky-700'
  }
};

export function QuizzesList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'attempted' | 'ready'

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const res = await api.get('/quizzes');
        setQuizzes(res.quizzes || []);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      // Status filter
      const hasAttempted = q.latestAttemptScore !== null;
      if (statusFilter === 'attempted' && !hasAttempted) return false;
      if (statusFilter === 'ready' && hasAttempted) return false;

      // Subject filter
      if (subjectFilter !== 'all' && q.subjectName !== subjectFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchTitle = q.title?.toLowerCase().includes(term);
        const matchDesc = q.description?.toLowerCase().includes(term);
        const matchSub = q.subjectName?.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc && !matchSub) return false;
      }

      return true;
    });
  }, [quizzes, statusFilter, subjectFilter, searchQuery]);

  const attemptedCount = quizzes.filter((q) => q.latestAttemptScore !== null).length;
  const readyCount = quizzes.length - attemptedCount;

  // Available subjects
  const availableSubjects = useMemo(() => {
    const set = new Set();
    quizzes.forEach((q) => {
      if (q.subjectName) set.add(q.subjectName);
    });
    return Array.from(set);
  }, [quizzes]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Loading your ICSE practice assessments...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/25">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Class 8 ICSE Board Assessments</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Instant Worked Solutions ✨</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Quizzes & Practice Tests Arena
            </h1>

            <p className="text-xs sm:text-sm text-orange-50 font-medium leading-relaxed">
              Test your understanding chapter by chapter. Practice with real exam timers, get immediate scores, and review verified step-by-step ICSE solutions.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Total Tests
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-white">
                {quizzes.length} Live
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Attempted
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-amber-300">
                {attemptedCount} Cleared
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Ready to Take
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-emerald-300">
                {readyCount} Tests
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. FILTER & SEARCH CONTROLS
      ---------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by chapter name or subject..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-orange-500"
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
              All Tests ({quizzes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('attempted')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'attempted'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attempted ({attemptedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'ready'
                  ? 'bg-white text-orange-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ready to Take ({readyCount})
            </button>
          </div>
        </div>

        {/* Subject Filter Chips */}
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
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------
          3. QUIZZES GRID
      ---------------------------------------------------- */}
      {filteredQuizzes.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-base text-slate-900">
            No practice tests found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No assessments match your current filters. Try selecting a different subject or clearing your search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredQuizzes.map((quiz) => {
            const hasAttempted = quiz.latestAttemptScore !== null;
            const mins = Math.round(quiz.durationSeconds / 60);
            const style = SUBJECT_COLORS[quiz.subjectName] || {
              badge: 'bg-slate-100 text-slate-800 border-slate-200',
              border: 'border-slate-200 hover:border-orange-400',
              btn: 'bg-orange-500 hover:bg-orange-600'
            };

            return (
              <div
                key={quiz.id}
                className={`bg-white rounded-3xl border ${style.border} p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-all group`}
              >
                {/* Card Top: Badges & Timer */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}
                    >
                      {quiz.subjectName}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>{mins} mins</span>
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-orange-600 transition-colors leading-snug mb-1.5">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {quiz.description || 'Comprehensive ICSE Class 8 evaluation with worked solutions.'}
                  </p>

                  {/* Micro Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 py-2.5 border-y border-slate-100 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{quiz.questionCount} Questions</span>
                    </span>
                    <span>•</span>
                    <span>Attempts: {quiz.attemptsUsed} / {quiz.attemptLimit || '∞'}</span>
                  </div>
                </div>

                {/* Card Bottom: Scores & CTA */}
                <div className="pt-2 flex items-center justify-between">
                  {hasAttempted ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-medium">Last Score:</span>
                        <span className="font-extrabold text-orange-600 text-sm">
                          {quiz.latestAttemptScore} / {quiz.latestAttemptMax}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        ✓ Recorded on Server
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 italic font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Not started yet</span>
                    </div>
                  )}

                  <Link
                    to={`/app/quizzes/${quiz.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      hasAttempted ? 'bg-amber-500 hover:bg-amber-600' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    <span>{hasAttempted ? 'Retake Test' : 'Start Test'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuizzesList;
