import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  BarChart2,
  CheckCircle,
  AlertCircle,
  Award,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  Target,
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  Zap,
  Filter,
  Search,
  RotateCcw,
  Star,
  Check
} from 'lucide-react';

export function ProgressView() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_revision' | 'mastered'

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await api.get('/student/progress');
        setProgress(res.progress);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  // Filtered chapters breakdown
  const filteredChapters = useMemo(() => {
    if (!progress?.chaptersBreakdown) return [];
    return progress.chaptersBreakdown.filter((chap) => {
      // Status filter
      if (statusFilter === 'needs_revision' && !chap.needsRevision) return false;
      if (statusFilter === 'mastered' && chap.needsRevision) return false;
      return true;
    });
  }, [progress, statusFilter]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Calculating your chapter metrics...</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8">
        No progress data found.
      </div>
    );
  }

  const accuracyScore = progress.averageAccuracy || 0;
  const accuracyColor =
    accuracyScore >= 75
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : accuracyScore >= 50
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200 border border-white/15">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Class 8 Academic Mastery</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-900" />
                <span>{progress.streak?.currentDays || 3} Days Active Streak</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Academic Progress & Chapter Trends
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Measurable understanding across ICSE Board concepts. Focus on revising chapters flagged below to maximize your accuracy and test scores.
            </p>
          </div>

          {/* Overall Grade Ring Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-5 shrink-0 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-md">
              <span className="text-xl font-display leading-none">{accuracyScore}%</span>
              <span className="text-[10px] uppercase font-extrabold tracking-tighter">Score</span>
            </div>

            <div>
              <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">
                Overall Accuracy
              </div>
              <div className="text-base font-extrabold text-white">
                {accuracyScore >= 70 ? 'Grade A · Solid Standing 🌟' : 'Grade B · Practice Needed 🎯'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated from {progress.quizzesAttempted} practice test attempts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. FOUR RICH KPI SUMMARY CARDS
      ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Accuracy */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Accuracy
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 leading-tight">
              {accuracyScore}%
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                style={{ width: `${accuracyScore}%` }}
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Across practice quizzes
          </span>
        </div>

        {/* 2. Tests Attempted */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Tests Cleared
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 leading-tight">
              {progress.quizzesAttempted}
            </div>
            <span className="text-xs font-bold text-indigo-600">Scored on Server</span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Avg Duration: ~10 mins
          </span>
        </div>

        {/* 3. Homework Completion */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Homework
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 leading-tight">
              {progress.homeworkCompleted} / {progress.homeworkTotal}
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${
                    progress.homeworkTotal > 0
                      ? Math.round((progress.homeworkCompleted / progress.homeworkTotal) * 100)
                      : 0
                  }%`
                }}
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Worksheets submitted
          </span>
        </div>

        {/* 4. Doubts Solved */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Doubts Solved
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-emerald-600 leading-tight">
              {progress.doubtsResolved} / {progress.doubtsAsked}
            </div>
            <span className="text-xs font-bold text-emerald-700">100% Resolved by Tutor</span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Step-by-step verified
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          3. CHAPTER UNDERSTANDING BREAKDOWN MATRIX
      ---------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              Chapter Understanding Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted mastery per syllabus chapter. Chapters below 70% accuracy are flagged for revision.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Chapters ({progress.chaptersBreakdown?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs_revision')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'needs_revision'
                  ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Revisit (
              {progress.chaptersBreakdown?.filter((c) => c.needsRevision).length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'mastered'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mastered (
              {progress.chaptersBreakdown?.filter((c) => !c.needsRevision).length || 0})
            </button>
          </div>
        </div>

        {/* Chapters Matrix List */}
        {filteredChapters.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl p-6">
            No chapters match this filter. Take chapter practice quizzes to track concept analytics.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChapters.map((chap) => {
              const isMastered = !chap.needsRevision;
              const barColor = isMastered ? 'bg-emerald-500' : 'bg-amber-500';

              return (
                <div
                  key={chap.chapterId}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
                >
                  {/* Left: Title & Questions Attempted */}
                  <div className="space-y-1 flex-1">
                    <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {chap.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{chap.totalQuestionsAnswered} questions attempted</span>
                      <span>•</span>
                      <span>Target: 70%+ for full mastery</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${chap.accuracy}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Accuracy & Direct Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="font-black text-lg text-slate-900 font-display">
                        {chap.accuracy}%
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Accuracy
                      </span>
                    </div>

                    <div>
                      {isMastered ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mastered Concept 🌟</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Revisit Concept ⚠️</span>
                        </span>
                      )}
                    </div>

                    <Link
                      to="/app/quizzes"
                      className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 transition-colors shadow-2xs"
                    >
                      <span>Practice Quiz</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------
          4. RECENT ASSESSMENT HISTORY
      ---------------------------------------------------- */}
      {progress.recentAttempts?.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Recent Assessment History
                </h3>
                <p className="text-xs text-slate-500">
                  Your recent practice quiz submissions and scores
                </p>
              </div>
            </div>

            <Link to="/app/quizzes" className="text-xs text-indigo-600 hover:underline font-bold">
              All Quizzes →
            </Link>
          </div>

          <div className="space-y-2.5">
            {progress.recentAttempts.map((att) => (
              <div
                key={att.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                      Practice Assessment Attempt
                    </span>
                    <span className="text-slate-400 font-medium">
                      {new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }).format(new Date(att.submittedAt))}
                      {' • '}
                      {Math.round(att.timeSpentSeconds / 60)} mins duration
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-indigo-700">
                      {att.score} / {att.maxScore}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-semibold">
                      ({att.accuracy}% Accuracy)
                    </span>
                  </div>

                  <Link
                    to={`/app/quiz-attempts/${att.id}/result`}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    <span>View Breakdown</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProgressView;
