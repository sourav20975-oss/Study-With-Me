import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import {
  FileText,
  HelpCircle,
  FileCheck,
  CheckSquare,
  Sparkles,
  ArrowRight,
  BookOpen,
  Newspaper,
  Plus,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Calculator,
  FlaskConical,
  Globe,
  Layers,
  Zap,
  ChevronRight,
  UserCheck
} from 'lucide-react';

const SUBJECT_ITEMS = [
  { id: 'sub-maths', name: 'Mathematics', chapters: 4, notes: 5, icon: Calculator, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'sub-science', name: 'Science', chapters: 3, notes: 2, icon: FlaskConical, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'sub-english', name: 'English', chapters: 1, notes: 0, icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'sub-social', name: 'Social Science', chapters: 1, notes: 0, icon: Globe, color: 'text-teal-600 bg-teal-50 border-teal-200' }
];

export function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoubts, setPendingDoubts] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashRes, doubtsRes, subsRes] = await Promise.all([
          api.get('/analytics/dashboard').catch(() => ({ stats: {} })),
          api.get('/admin/doubts').catch(() => ({ doubts: [] })),
          api.get('/admin/submissions').catch(() => ({ submissions: [] }))
        ]);

        setAnalytics(dashRes.stats || {});
        const pDoubts = (doubtsRes.doubts || []).filter((d) => d.status === 'pending');
        const pSubs = (subsRes.submissions || []).filter((s) => s.status === 'submitted');
        setPendingDoubts(pDoubts);
        setPendingSubmissions(pSubs);
      } catch (err) {
        console.error('Failed to load tutor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-semibold">Opening Tutor Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-6 sm:p-8 text-white shadow-md border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                Academic Administration
              </span>
              <span className="text-xs text-slate-400">• ICSE Class 8 Curriculum</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Sourav Kumar'} 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your Class 8 curriculum workbench is live. Review questions, evaluate student homework, answer pending doubts, and curate science discoveries.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/admin/notes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-orange-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Note</span>
            </Link>

            <Link
              to="/admin/ai-question-generator"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/20 backdrop-blur-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Question Studio</span>
            </Link>

            <Link
              to="/admin/assignments"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/20 backdrop-blur-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Homework</span>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 w-60 h-60 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Notes */}
        <Link
          to="/admin/notes"
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-xs transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Notes</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {analytics?.publishedNotesCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>ICSE Chapter Notes</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Metric 2: Question Bank */}
        <Link
          to="/admin/questions"
          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-xs transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Question Bank</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {analytics?.totalQuestions ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center justify-between">
            <span>Auto-synced with Student Quiz</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Metric 3: Doubts Queue */}
        <Link
          to="/admin/doubts"
          className={`p-4 sm:p-5 rounded-2xl border transition-all group shadow-2xs ${
            pendingDoubts.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200/90 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Doubts Queue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>{pendingDoubts.length}</span>
            {pendingDoubts.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                Action needed
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Student questions pending</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Metric 4: Homework Grading */}
        <Link
          to="/admin/assignments"
          className={`p-4 sm:p-5 rounded-2xl border transition-all group shadow-2xs ${
            pendingSubmissions.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200/90 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Homework Grading</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {pendingSubmissions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Submissions to evaluate</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Curriculum Subjects Quick Access */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              ICSE Class 8 Curriculum Workbench
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any subject to manage chapters, write notes, and verify problem sets.
            </p>
          </div>
          <Link
            to="/admin/subjects"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Manage All Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUBJECT_ITEMS.map((sub) => {
            const Icon = sub.icon;
            const dyn = (analytics?.subjects || []).find((s) => s.id === sub.id);
            const notesCount = dyn?.notes ?? sub.notes;
            const chapsCount = dyn?.chapters ?? sub.chapters;

            return (
              <Link
                key={sub.id}
                to={`/admin/notes?subjectId=${sub.id}`}
                className="p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${sub.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                    {notesCount} notes
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
                    {sub.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {chapsCount} chapters mapped
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Priority Action Queues: Doubts & Homework */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Priority 1: Pending Student Doubts */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Student Doubts ({pendingDoubts.length})
                </h3>
              </div>
              <Link
                to="/admin/doubts"
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <span>Open Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingDoubts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">All student doubts answered!</p>
                <p className="text-[11px] text-slate-400">Your doubt queue is clear. New inquiries will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 mt-3">
                {pendingDoubts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{d.studentName || 'Student'}</span>
                      <span className="text-[11px] text-orange-600 font-semibold">{d.subjectName}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {d.questionText}
                    </p>
                    <div className="pt-1 flex justify-end">
                      <Link
                        to="/admin/doubts"
                        className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <span>Answer with AI Assistant</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Student notification auto-triggers on publish</span>
            <Link to="/admin/doubts" className="font-bold text-slate-700 hover:text-orange-600">
              View all inquiries →
            </Link>
          </div>
        </section>

        {/* Priority 2: Homework Submissions */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Homework Submissions ({pendingSubmissions.length})
                </h3>
              </div>
              <Link
                to="/admin/assignments"
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <span>Grading Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">All submissions graded!</p>
                <p className="text-[11px] text-slate-400">Worksheet solutions evaluated with scores and feedback.</p>
              </div>
            ) : (
              <div className="space-y-2.5 mt-3">
                {pendingSubmissions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{s.studentName || 'Aarav Sharma'}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">{s.assignmentTitle}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 font-mono">
                      {s.textAnswer || 'Worksheet pages attached'}
                    </p>
                    <div className="pt-1 flex justify-end">
                      <Link
                        to="/admin/assignments"
                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <span>Evaluate & Award Marks</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Scorecard and feedback synced to student</span>
            <Link to="/admin/assignments" className="font-bold text-slate-700 hover:text-emerald-700">
              Open Homework Studio →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
