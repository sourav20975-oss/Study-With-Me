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
  Check,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export function ProgressView() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_revision' | 'mastered'
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Chart interactivity states
  const [activeTrendPoint, setActiveTrendPoint] = useState(null);
  const [activeActivityDay, setActiveActivityDay] = useState(null);
  const [activityMetric, setActivityMetric] = useState('minutes'); // 'minutes' | 'questions'
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await api.get('/student/progress');
        setProgress(res.progress);
        setTimeout(() => setChartLoaded(true), 150);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  // Filtered chapters breakdown (supporting 4 authentic status tiers)
  const filteredChapters = useMemo(() => {
    if (!progress?.chaptersBreakdown) return [];
    return progress.chaptersBreakdown.filter((chap) => {
      if (statusFilter === 'needs_revision' && chap.status !== 'needs_revision') return false;
      if (statusFilter === 'mastered' && chap.status !== 'mastered') return false;
      if (statusFilter === 'learning' && chap.status !== 'learning') return false;
      if (statusFilter === 'unattempted' && chap.status !== 'unattempted') return false;
      if (subjectFilter !== 'all' && chap.subjectId !== subjectFilter) return false;
      return true;
    });
  }, [progress, statusFilter, subjectFilter]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Calculating your live chapter metrics & animated charts...</p>
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
  const trendData = progress.accuracyTrend || [];
  const subjectPerformance = progress.subjectPerformance || [];
  const weeklyActivity = progress.weeklyStudyActivity || [];
  const masteryDist = progress.masteryDistribution || {
    masteredPct: 0,
    learningPct: 0,
    revisionPct: 0,
    unattemptedPct: 100,
    masteredCount: 0,
    learningCount: 0,
    revisionCount: 0,
    unattemptedCount: 0,
    totalChapters: progress.chaptersBreakdown?.length || 0
  };

  // Peak study day & totals dynamically calculated
  const peakDay = weeklyActivity.length > 0 ? weeklyActivity.reduce((prev, curr) => {
    const val = activityMetric === 'minutes' ? curr.minutes : curr.questions;
    const prevVal = activityMetric === 'minutes' ? (prev?.minutes || 0) : (prev?.questions || 0);
    return val > prevVal ? curr : prev;
  }, weeklyActivity[0]) : null;

  const totalWeeklyMinutes = weeklyActivity.reduce((sum, curr) => sum + (curr.minutes || 0), 0);
  const totalWeeklyQuestions = weeklyActivity.reduce((sum, curr) => sum + (curr.questions || 0), 0);

  // SVG Trend Chart Coordinates (Dynamic for any number of points)
  const chartPoints = trendData.length > 0
    ? trendData.map((pt, i) => {
        const x = trendData.length === 1 ? 350 : 50 + (i * (600 / (trendData.length - 1)));
        const y = 180 - (Math.min(Math.max(pt.accuracy, 0), 100) * 1.4);
        return { ...pt, x, y };
      })
    : [];

  // Build SVG path dynamically
  let pathD = '';
  let areaD = '';
  if (chartPoints.length > 1) {
    pathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} 190 L ${chartPoints[0].x} 190 Z`;
  } else if (chartPoints.length === 1) {
    pathD = `M 40 ${chartPoints[0].y} L 660 ${chartPoints[0].y}`;
    areaD = `M 40 ${chartPoints[0].y} L 660 ${chartPoints[0].y} L 660 190 L 40 190 Z`;
  }

  // Dynamic Grade Evaluation
  const gradeLabel = progress.quizzesAttempted === 0
    ? 'No Tests Yet · Ready to Begin 🚀'
    : accuracyScore >= 80
    ? 'Grade A+ · Outstanding Mastery 🌟'
    : accuracyScore >= 70
    ? 'Grade A · Solid Standing 🎯'
    : accuracyScore >= 50
    ? 'Grade B · Steady Rhythm 📈'
    : 'Grade C · Needs Guided Practice 💡';

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-16 max-w-7xl mx-auto">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-orange-200 border border-white/15">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Class 8 Academic Mastery</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-900" />
                <span>{progress.streak?.currentDays || 0} Days Active Streak</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                100% Dynamic Analytics
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Academic Progress & Visual Analytics 📊
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Real-time animated performance curves, subject comparisons, and concept mastery distributions calculated live from your assessments.
            </p>
          </div>

          {/* Overall Grade Ring Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-5 shrink-0 shadow-sm">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-md animate-chart-glow">
              <span className="text-xl font-display leading-none">{accuracyScore}%</span>
              <span className="text-[10px] uppercase font-extrabold tracking-tighter">Score</span>
            </div>

            <div>
              <div className="text-[11px] text-orange-200 font-bold uppercase tracking-wider">
                Overall Accuracy
              </div>
              <div className="text-base font-extrabold text-white">
                {gradeLabel}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated from {progress.quizzesAttempted} practice test attempt{progress.quizzesAttempted === 1 ? '' : 's'}
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
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between group hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Accuracy Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 leading-tight flex items-baseline gap-1.5">
              {accuracyScore}%
              {progress.accuracyChange !== null && progress.accuracyChange !== undefined ? (
                <span className={`text-xs font-bold font-sans ${
                  progress.accuracyChange > 0
                    ? 'text-emerald-600'
                    : progress.accuracyChange < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}>
                  {progress.accuracyChange > 0 ? `↑ +${progress.accuracyChange}%` : progress.accuracyChange < 0 ? `↓ ${progress.accuracyChange}%` : '→ 0%'}
                </span>
              ) : progress.quizzesAttempted === 1 ? (
                <span className="text-xs font-bold text-indigo-600 font-sans">First test</span>
              ) : (
                <span className="text-xs font-bold text-slate-400 font-sans">No tests</span>
              )}
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: chartLoaded ? `${accuracyScore}%` : '0%' }}
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">Across practice quizzes</span>
        </div>

        {/* 2. Tests Cleared */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between group hover:border-indigo-300 transition-all">
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
              {progress.quizzesAttempted} Quizzes
            </div>
            <span className="text-xs font-bold text-indigo-600">Scored on Server</span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            {progress.avgDurationMinutes > 0 ? `Avg Duration: ~${progress.avgDurationMinutes} mins` : 'No timed attempts'}
          </span>
        </div>

        {/* 3. Homework Completion */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Homework Sheets
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 leading-tight">
              {progress.homeworkCompleted} / {progress.homeworkTotal}
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: chartLoaded
                    ? `${progress.homeworkTotal > 0 ? Math.round((progress.homeworkCompleted / progress.homeworkTotal) * 100) : 0}%`
                    : '0%'
                }}
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            {progress.homeworkTotal > 0
              ? `${Math.round((progress.homeworkCompleted / progress.homeworkTotal) * 100)}% submitted`
              : 'No worksheets assigned'}
          </span>
        </div>

        {/* 4. Doubts Solved */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between group hover:border-teal-300 transition-all">
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
            <span className="text-xs font-bold text-emerald-700">
              {progress.doubtsAsked > 0
                ? `${Math.round((progress.doubtsResolved / progress.doubtsAsked) * 100)}% Resolved by Tutor`
                : '0 Active Doubts'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">Step-by-step verified</span>
        </div>
      </div>

      {/* ----------------------------------------------------
          CHART 1: 📈 ANIMATED ACCURACY & SCORE TREND CURVE
      ---------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                Performance & Accuracy Progression Curve
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visual trajectory across your recent tests. Hover over any point to inspect test scores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
              <Target className="w-3.5 h-3.5 text-orange-500" />
              <span>Target: 75% Mastery</span>
            </span>
            {trendData.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>Latest: {trendData[trendData.length - 1].accuracy}%</span>
              </span>
            )}
          </div>
        </div>

        {/* SVG Animated Bezier Line Chart or Empty State */}
        {trendData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-orange-400 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No practice assessments completed yet</p>
            <p className="text-slate-400">Complete chapter quizzes to start charting your accuracy trend curve.</p>
            <div className="pt-2">
              <Link
                to="/app/quizzes"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors shadow-xs"
              >
                <span>Start Practice Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative w-full pt-2">
          {/* Active Hover Floating Tooltip */}
          {activeTrendPoint && (
            <div
              className="absolute z-20 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
              style={{
                left: `${(activeTrendPoint.x / 700) * 100}%`,
                top: `${(activeTrendPoint.y / 220) * 100}%`
              }}
            >
              <div className="text-orange-400 font-bold text-[11px]">{activeTrendPoint.title}</div>
              <div className="text-sm font-black mt-0.5">{activeTrendPoint.accuracy}% Accuracy ({activeTrendPoint.score})</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{activeTrendPoint.date}</div>
            </div>
          )}

          <div className="overflow-x-auto">
            <svg
              viewBox="0 0 700 220"
              className="w-full h-52 sm:h-60 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#f97316" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines */}
              {[100, 75, 50, 25].map((lvl) => {
                const y = 180 - (lvl * 1.4);
                const isTarget = lvl === 75;
                return (
                  <g key={lvl}>
                    <line
                      x1="40"
                      y1={y}
                      x2="660"
                      y2={y}
                      stroke={isTarget ? '#f59e0b' : '#f1f5f9'}
                      strokeWidth={isTarget ? 1.5 : 1}
                      strokeDasharray={isTarget ? '4 4' : 'none'}
                    />
                    <text
                      x="25"
                      y={y + 4}
                      fill={isTarget ? '#d97706' : '#94a3b8'}
                      fontSize="10"
                      fontWeight={isTarget ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {lvl}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {chartLoaded && (
                <path
                  d={areaD}
                  fill="url(#trendGradient)"
                  className="animate-chart-fade"
                />
              )}

              {/* Animated Stroke Line */}
              {chartLoaded && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-chart-line"
                />
              )}

              {/* Target Indicator Label */}
              <text x="640" y="70" fill="#d97706" fontSize="10" fontWeight="bold" textAnchor="end">
                Mastery Benchmark (75%)
              </text>

              {/* Interactive Dots on Curve */}
              {chartLoaded &&
                chartPoints.map((pt) => {
                  const isHovered = activeTrendPoint?.testNumber === pt.testNumber;
                  return (
                    <g
                      key={pt.testNumber}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setActiveTrendPoint(pt)}
                      onMouseLeave={() => setActiveTrendPoint(null)}
                      onClick={() => setActiveTrendPoint(pt)}
                    >
                      {/* Glow circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 9 : 6}
                        fill="#ea580c"
                        stroke="#ffffff"
                        strokeWidth="3"
                        className="transition-all duration-200 shadow-lg"
                      />
                      {/* Value label on top of dot */}
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        fill="#0f172a"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pt.accuracy}%
                      </text>
                      {/* Date label at bottom axis */}
                      <text
                        x={pt.x}
                        y="208"
                        fill="#64748b"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {pt.date}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
        </div>
      )}
      </section>

      {/* ----------------------------------------------------
          TWO-COLUMN GRID:
          CHART 2: SUBJECT COMPARISON BARS
          CHART 3: SYLLABUS MASTERY DONUT
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 2: SUBJECT PERFORMANCE COMPARISON (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                <BarChart2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Subject-Wise Accuracy Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Performance across core Class 8 ICSE subjects
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">Target: 75%</span>
          </div>

          {/* Animated Subject Bars */}
          <div className="space-y-4 pt-1">
            {subjectPerformance.map((sub, idx) => {
              const isAboveTarget = sub.accuracy >= sub.target;
              return (
                <div key={sub.name} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({sub.questionsPracticed} Qs solved)
                      </span>
                    </span>

                    <span className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        !sub.attempted
                          ? 'bg-slate-100 text-slate-500'
                          : isAboveTarget
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {!sub.attempted ? 'Not Attempted' : isAboveTarget ? 'On Target ✓' : 'Practice Needed'}
                      </span>
                      <span className="text-slate-900 font-black text-sm">{sub.attempted ? `${sub.accuracy}%` : '0%'}</span>
                    </span>
                  </div>

                  {/* Dual Layer Progress Bar with Target Marker */}
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${sub.gradient} transition-all duration-1000 ease-out`}
                      style={{
                        width: chartLoaded && sub.attempted ? `${sub.accuracy}%` : '0%',
                        transitionDelay: `${idx * 120}ms`
                      }}
                    />
                    {/* Dotted Target Line Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900/60 z-10"
                      style={{ left: '75%' }}
                      title="75% Benchmark Target"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dotted line represents 75% ICSE Mastery target.</span>
            <Link to="/app/subjects" className="text-indigo-600 hover:underline font-bold flex items-center gap-1">
              <span>View Syllabi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* CHART 3: SYLLABUS MASTERY DONUT & RING (5 Cols) */}
        <section className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Concept Mastery Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Distribution of concepts across 4 authentic mastery tiers
                </p>
              </div>
            </div>
          </div>

          {/* SVG Animated Circular Ring */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                {/* Mastered Segment (Emerald) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${(masteryDist.masteredPct / 100) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Learning Segment (Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${(masteryDist.learningPct / 100) * 251.2} 251.2`}
                  strokeDashoffset={`-${(masteryDist.masteredPct / 100) * 251.2}`}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Revision Segment (Rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="12"
                  strokeDasharray={`${(masteryDist.revisionPct / 100) * 251.2} 251.2`}
                  strokeDashoffset={`-${((masteryDist.masteredPct + masteryDist.learningPct) / 100) * 251.2}`}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Unattempted Segment (Slate) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#cbd5e1"
                  strokeWidth="12"
                  strokeDasharray={`${(masteryDist.unattemptedPct / 100) * 251.2} 251.2`}
                  strokeDashoffset={`-${((masteryDist.masteredPct + masteryDist.learningPct + masteryDist.revisionPct) / 100) * 251.2}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Inner Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-display text-slate-900 leading-none">
                  {accuracyScore}%
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                  {progress.quizzesAttempted > 0 ? 'Mastery' : 'No Tests'}
                </span>
              </div>
            </div>

            {/* Legend Tiers */}
            <div className="space-y-2 flex-1 w-full text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-950">Mastered (80%+)</span>
                </div>
                <span className="font-extrabold text-emerald-800">{masteryDist.masteredPct}% ({masteryDist.masteredCount} Chaps)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-950">Learning (60-79%)</span>
                </div>
                <span className="font-extrabold text-amber-800">{masteryDist.learningPct}% ({masteryDist.learningCount} Chaps)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-bold text-rose-950">Needs Revision</span>
                </div>
                <span className="font-extrabold text-rose-800">{masteryDist.revisionPct}% ({masteryDist.revisionCount} Chaps)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-700">Not Attempted</span>
                </div>
                <span className="font-extrabold text-slate-600">{masteryDist.unattemptedPct}% ({masteryDist.unattemptedCount} Chaps)</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            {masteryDist.masteredCount} out of {masteryDist.totalChapters || progress.chaptersBreakdown?.length || 6} Class 8 syllabus chapters have reached Mastered standing.
          </p>
        </section>
      </div>

      {/* ----------------------------------------------------
          CHART 4: ⏱️ 7-DAY STUDY EFFORT & ACTIVE MINUTES (ANIMATED PILLARS)
      ---------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                Weekly Study Time & Focus Rhythm
              </h2>
              <p className="text-xs text-slate-500">
                Track your active study minutes and daily problem-solving volume
              </p>
            </div>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setActivityMetric('minutes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityMetric === 'minutes'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Minutes
            </button>
            <button
              onClick={() => setActivityMetric('questions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activityMetric === 'questions'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Questions Solved
            </button>
          </div>
        </div>

        {/* 7 Animated Rising Pillars */}
        <div className="relative pt-6 pb-2">
          {/* Target line across pillars */}
          <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-amber-300 z-0 pointer-events-none" />
          <span className="absolute right-0 top-1/2 -mt-5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            Daily Goal (45 mins)
          </span>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 relative z-10 px-2">
            {weeklyActivity.map((act, idx) => {
              const val = activityMetric === 'minutes' ? act.minutes : act.questions;
              const maxVal = activityMetric === 'minutes' ? 100 : 35;
              const heightPct = Math.min(Math.round((val / maxVal) * 100), 100);
              const isPeak = peakDay && act.date === peakDay.date && (peakDay.minutes > 0 || peakDay.questions > 0);

              return (
                <div
                  key={act.day + act.date}
                  className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer"
                  onMouseEnter={() => setActiveActivityDay(act)}
                  onMouseLeave={() => setActiveActivityDay(null)}
                >
                  {/* Floating Value on hover or peak */}
                  <div className={`text-[11px] font-bold transition-all ${
                    isPeak ? 'text-orange-600 font-extrabold' : 'text-slate-600'
                  }`}>
                    {val}{activityMetric === 'minutes' ? 'm' : ' Qs'}
                  </div>

                  {/* Rising Bar Pillar */}
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-2xl h-32 flex items-end p-1 overflow-hidden group-hover:bg-slate-200 transition-colors">
                    <div
                      className={`w-full rounded-xl transition-all duration-1000 ease-out shadow-xs ${
                        isPeak
                          ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                          : 'bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:from-orange-500 group-hover:to-amber-400'
                      }`}
                      style={{
                        height: chartLoaded ? `${heightPct}%` : '0%',
                        transitionDelay: `${idx * 80}ms`
                      }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={`text-xs font-bold ${isPeak ? 'text-orange-600' : 'text-slate-500'}`}>
                    {act.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner Insight */}
        <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between text-xs text-orange-950">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600 fill-current shrink-0" />
            <span>
              {peakDay && (peakDay.minutes > 0 || peakDay.questions > 0) ? (
                <>
                  <strong>Peak Study Day:</strong> {peakDay.day} was your highest study session with <strong>{peakDay.minutes} mins</strong> & <strong>{peakDay.questions} questions</strong> practiced!
                </>
              ) : (
                <>
                  <strong>Daily Consistency:</strong> Solve practice tests and submit assignments to build your weekly rhythm!
                </>
              )}
            </span>
          </div>
          <span className="hidden sm:inline font-bold text-orange-700">
            Total: ~{totalWeeklyMinutes} mins ({totalWeeklyQuestions} Qs) this week 🔥
          </span>
        </div>
      </section>

      {/* ----------------------------------------------------
          5. CHAPTER UNDERSTANDING BREAKDOWN MATRIX (ENHANCED)
      ---------------------------------------------------- */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              Chapter Understanding Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted mastery per syllabus chapter. Filter by progress standing.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({progress.chaptersBreakdown?.length || 0})
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
              Mastered ({progress.chaptersBreakdown?.filter((c) => c.status === 'mastered').length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('learning')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'learning'
                  ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Learning ({progress.chaptersBreakdown?.filter((c) => c.status === 'learning').length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs_revision')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'needs_revision'
                  ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Revisit ({progress.chaptersBreakdown?.filter((c) => c.status === 'needs_revision').length || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unattempted')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'unattempted'
                  ? 'bg-white text-slate-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Started ({progress.chaptersBreakdown?.filter((c) => c.status === 'unattempted').length || 0})
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
              const isUnattempted = chap.status === 'unattempted';
              const isMastered = chap.status === 'mastered';
              const isLearning = chap.status === 'learning';
              const isRevision = chap.status === 'needs_revision';

              const barColor = isMastered
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : isLearning
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                : isRevision
                ? 'bg-gradient-to-r from-rose-500 to-orange-500'
                : 'bg-slate-300';

              return (
                <div
                  key={chap.chapterId}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
                >
                  {/* Left: Title & Subject Pill */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                        {chap.subjectName || 'ICSE Class 8'}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug">
                        {chap.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{chap.totalQuestionsAnswered} questions attempted</span>
                      <span>•</span>
                      <span>{isUnattempted ? 'Target: 70%+ for full mastery' : `Standing: ${chap.accuracy}%`}</span>
                    </div>

                    {/* Progress Bar with animated fill */}
                    <div className="w-full max-w-md h-2.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: chartLoaded ? `${chap.accuracy}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Right: Accuracy & Direct Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="font-black text-xl text-slate-900 font-display">
                        {chap.accuracy}%
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Accuracy
                      </span>
                    </div>

                    <div>
                      {isUnattempted && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200/80 text-slate-700 border border-slate-300 shadow-2xs">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Not Started Yet ⏳</span>
                        </span>
                      )}
                      {isMastered && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mastered Concept 🌟</span>
                        </span>
                      )}
                      {isLearning && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>In Learning 📈</span>
                        </span>
                      )}
                      {isRevision && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Needs Revision ⚠️</span>
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
          6. RECENT ASSESSMENT HISTORY
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
