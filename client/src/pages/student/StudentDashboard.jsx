import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  BookOpen,
  CheckSquare,
  HelpCircle,
  FileCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Newspaper,
  Calendar,
  Flame,
  Zap,
  Target,
  Trophy,
  Sparkles,
  Calculator,
  FlaskConical,
  Globe,
  Star,
  Check,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  RotateCcw,
  ListTodo,
  CheckCircle2
} from 'lucide-react';

const SUBJECTS_META = [
  {
    id: 'sub-maths',
    name: 'Mathematics',
    tag: 'Algebra, Geometry & Fractions',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50/60 hover:from-amber-100/70 hover:to-orange-100/70',
    border: 'border-orange-200/90 hover:border-orange-400',
    text: 'text-orange-950',
    badge: 'bg-orange-500 text-white',
    icon: Calculator,
    iconColor: 'text-orange-600',
    accentBorder: 'border-l-orange-500'
  },
  {
    id: 'sub-science',
    name: 'Science',
    tag: 'Physics, Chemistry & Biology',
    bg: 'bg-gradient-to-br from-teal-50 to-emerald-50/60 hover:from-teal-100/70 hover:to-emerald-100/70',
    border: 'border-teal-200/90 hover:border-teal-400',
    text: 'text-teal-950',
    badge: 'bg-teal-600 text-white',
    icon: FlaskConical,
    iconColor: 'text-teal-600',
    accentBorder: 'border-l-teal-500'
  },
  {
    id: 'sub-english',
    name: 'English',
    tag: 'Honeydew Prose, Poetry & Grammar',
    bg: 'bg-gradient-to-br from-amber-50/70 to-yellow-50/60 hover:from-amber-100/70 hover:to-yellow-100/70',
    border: 'border-amber-200/90 hover:border-amber-400',
    text: 'text-amber-950',
    badge: 'bg-amber-600 text-white',
    icon: BookOpen,
    iconColor: 'text-amber-600',
    accentBorder: 'border-l-amber-500'
  },
  {
    id: 'sub-social',
    name: 'Social Science',
    tag: 'History, Civics & Geography',
    bg: 'bg-gradient-to-br from-sky-50 to-indigo-50/60 hover:from-sky-100/70 hover:to-indigo-100/70',
    border: 'border-sky-200/90 hover:border-sky-400',
    text: 'text-sky-950',
    badge: 'bg-sky-600 text-white',
    icon: Globe,
    iconColor: 'text-sky-600',
    accentBorder: 'border-l-sky-500'
  }
];

const PRIORITY_BADGES = {
  high: {
    label: 'High Priority',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: '🔥'
  },
  medium: {
    label: 'Medium',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: '⚡'
  },
  low: {
    label: 'Low',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: '🌿'
  }
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentDoubts, setRecentDoubts] = useState([]);
  const [news, setNews] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Todo CRUD state
  const [quickTitle, setQuickTitle] = useState('');
  const [todoFilter, setTodoFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    subjectId: 'sub-maths',
    priority: 'medium',
    dueAt: 'Today'
  });
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Streak Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 9, 1)); // Default to October 2026
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Initial Data Fetching
  const fetchDashboardData = async () => {
    try {
      const [tasksRes, quizzesRes, asgRes, notesRes, doubtsRes, newsRes, progRes] = await Promise.all([
        api.get('/student/tasks'),
        api.get('/quizzes'),
        api.get('/assignments'),
        api.get('/notes?role=student'),
        api.get('/doubts/mine'),
        api.get('/news'),
        api.get('/student/progress')
      ]);

      setTasks(tasksRes.tasks || []);
      setQuizzes(quizzesRes.quizzes || []);
      setAssignments(asgRes.assignments || []);
      setRecentNotes((notesRes.notes || []).slice(0, 3));
      setRecentDoubts((doubtsRes.doubts || []).slice(0, 3));
      setNews((newsRes.articles || []).slice(0, 3));
      setProgress(progRes.progress || null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ----------------------------------------------------
  // TODO CRUD HANDLERS
  // ----------------------------------------------------

  // Quick inline add task
  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const res = await api.post('/student/tasks', {
        title: quickTitle.trim(),
        dueAt: 'Today',
        priority: 'medium',
        subjectId: 'sub-maths'
      });
      if (res.task) {
        setTasks((prev) => [res.task, ...prev]);
        setQuickTitle('');
      }
    } catch (err) {
      alert(err.message || 'Failed to add task.');
    }
  };

  // Open modal for new task
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskFormData({
      title: '',
      description: '',
      subjectId: 'sub-maths',
      priority: 'medium',
      dueAt: 'Today'
    });
    setShowTaskModal(true);
  };

  // Open modal for editing existing task
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      subjectId: task.subjectId || 'sub-maths',
      priority: task.priority || 'medium',
      dueAt: task.dueAt || 'Today'
    });
    setShowTaskModal(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) {
      alert('Please enter a task title.');
      return;
    }

    setIsSavingTask(true);
    try {
      if (editingTask) {
        // UPDATE (PUT)
        const res = await api.put(`/student/tasks/${editingTask.id}`, taskFormData);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.task : t)));
      } else {
        // CREATE (POST)
        const res = await api.post('/student/tasks', taskFormData);
        setTasks((prev) => [res.task, ...prev]);
      }
      setShowTaskModal(false);
    } catch (err) {
      alert(err.message || 'Failed to save task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  // Toggle complete / incomplete
  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.patch(`/student/tasks/${taskId}/toggle`);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: res.task.completed } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this study task?')) return;
    try {
      await api.delete(`/student/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    if (!window.confirm(`Clear all ${completedCount} completed tasks?`)) return;

    try {
      await api.delete('/student/tasks/completed');
      setTasks((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      alert(err.message || 'Failed to clear completed tasks.');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (todoFilter === 'pending' && task.completed) return false;
      if (todoFilter === 'completed' && !task.completed) return false;

      // Priority filter
      if (priorityFilter !== 'all' && (task.priority || 'medium') !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, todoFilter, priorityFilter, searchQuery]);

  // Task Stats
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasksCount = tasks.length - completedTasksCount;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // ----------------------------------------------------
  // CALENDAR COMPUTATION
  // ----------------------------------------------------
  const activityMap = progress?.streak?.activityMap || {
    '2026-10-12': 3,
    '2026-10-11': 4,
    '2026-10-10': 2,
    '2026-10-08': 1,
    '2026-10-06': 3
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday as first day: 0=Mon, 6=Sun
    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const days = [];
    // Padding before month starts
    for (let i = 0; i < startingDay; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, dateStr: null });
    }

    // Days in current month
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday =
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      const count = activityMap[dateStr] || 0;

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        isToday,
        activityCount: count,
        hasActivity: count > 0
      });
    }

    return days;
  }, [calendarMonth, activityMap]);

  // Navigate calendar months
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };
  const handleResetToToday = () => {
    setCalendarMonth(new Date(2026, 9, 1));
  };

  const monthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric'
  }).format(calendarMonth);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  // Next quiz & homework
  const nextQuiz = quizzes.find((q) => q.status === 'published');
  const nextHomework = assignments.find((a) => !a.mySubmission);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Opening your study room...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. ULTRA MODERN HERO BANNER (Fully Responsive)
      ---------------------------------------------------- */}
      <section className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-orange-500/10 relative overflow-hidden">
        {/* Soft decorative background blurs */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Welcome Text */}
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide text-white border border-white/25 shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayFormatted}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-sm border border-amber-300">
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-900" />
                <span>{progress?.streak?.currentDays || 3} Days Streak! 🔥</span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-white/90">
                <Sparkles className="w-3 h-3 text-amber-200" />
                Class 8 ICSE Board
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Aarav'}! 🚀
            </h1>

            <p className="text-xs sm:text-sm text-orange-50/95 font-medium leading-relaxed">
              You've cleared{' '}
              <span className="font-extrabold text-white underline decoration-white/40 decoration-2 underline-offset-2">
                {completedTasksCount} of {tasks.length}
              </span>{' '}
              study missions today. Keep up the rhythm and reach your daily target!
            </p>
          </div>

          {/* Quick KPI Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 shrink-0">
            {/* Accuracy Score */}
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] text-orange-100 font-bold uppercase tracking-wider">
                  Accuracy
                </div>
                <div className="text-xl sm:text-2xl font-black font-display leading-tight">
                  {progress?.averageAccuracy || 78}% ⭐
                </div>
              </div>
            </div>

            {/* Todo Completion */}
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] text-orange-100 font-bold uppercase tracking-wider">
                  Tasks Done
                </div>
                <div className="text-xl sm:text-2xl font-black font-display leading-tight">
                  {completedTasksCount}/{tasks.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. CLASS 8 SUBJECT PORTALS (4 Responsive Tiles)
      ---------------------------------------------------- */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
              Class 8 Subject Portals
            </h2>
          </div>
          <Link
            to="/app/subjects"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
          >
            <span>Explore all syllabus</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
          {SUBJECTS_META.map((sub) => {
            const Icon = sub.icon;
            return (
              <Link
                key={sub.id}
                to={`/app/subjects/${sub.id}`}
                className={`p-4 sm:p-5 rounded-2xl border ${sub.border} ${sub.bg} transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-white shadow-xs flex items-center justify-center ${sub.iconColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${sub.badge}`}
                  >
                    Class 8
                  </span>
                </div>

                <div>
                  <h3 className={`font-display font-extrabold text-base sm:text-lg ${sub.text} leading-snug group-hover:text-orange-600 transition-colors`}>
                    {sub.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block mt-1 line-clamp-1">
                    {sub.tag}
                  </span>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-orange-600">
                  <span>Open Chapters</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------
          3. MAIN RESPONSIVE SPLIT: 
             Left (Planner, Streak, Notes) & Right (Tests, Homework, News)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* ====================================================
            LEFT COLUMN (lg:col-span-7 xl:col-span-8)
        ==================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
          {/* ----------------------------------------------------
              FEATURE 1: PERSONAL STUDY TODO PLANNER (FULL CRUD)
          ---------------------------------------------------- */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Planner Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-xs">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                      Study Planner & Tasks
                    </h2>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Full CRUD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan chapters, homework, and revision missions
                  </p>
                </div>
              </div>

              {/* Add Task & Clear Buttons */}
              <div className="flex items-center gap-2">
                {completedTasksCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                    title="Clear all completed tasks"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Done</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Mission</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & Motivation */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span>Today's Completion Pace</span>
                </span>
                <span className="text-orange-600 font-extrabold">
                  {completedTasksCount} / {tasks.length} ({taskProgressPercent}%)
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                {taskProgressPercent === 100 && tasks.length > 0
                  ? '🎉 Outstanding work! All planned missions completed today!'
                  : taskProgressPercent > 50
                  ? '⚡ Great momentum! More than half finished — finish strong!'
                  : '🌿 Tap a task checkbox when done to track your active study streak.'}
              </p>
            </div>

            {/* Quick Inline Add Form */}
            <form onSubmit={handleQuickAddTask} className="flex items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick add: e.g. Revise Chapter 1 Rational Numbers formulas..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 sm:mr-1 inline" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </form>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
                <button
                  type="button"
                  onClick={() => setTodoFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    todoFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTodoFilter('pending')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    todoFilter === 'pending'
                      ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingTasksCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTodoFilter('completed')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    todoFilter === 'completed'
                      ? 'bg-white text-emerald-600 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Done ({completedTasksCount})
                </button>
              </div>

              {/* Priority Chips */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400 font-bold hidden md:inline">Priority:</span>
                {['all', 'high', 'medium', 'low'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      priorityFilter === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">
                  {tasks.length === 0
                    ? 'No study tasks yet!'
                    : 'No tasks matching this filter.'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {tasks.length === 0
                    ? 'Create your first study mission using the input above to organize your goals.'
                    : 'Try switching filters to view other pending or completed tasks.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const prio = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
                  return (
                    <div
                      key={task.id}
                      className={`group flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        task.completed
                          ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xs text-slate-800'
                      }`}
                    >
                      {/* Left: Checkbox & Content */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Toggle Checkbox Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : 'border-slate-300 bg-white hover:border-orange-500 hover:bg-orange-50/30'
                          }`}
                          title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Title, Description & Tags */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-xs sm:text-sm font-bold leading-snug break-words ${
                                task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          {task.description && (
                            <p
                              className={`text-xs line-clamp-2 ${
                                task.completed ? 'text-slate-400 line-through' : 'text-slate-500'
                              }`}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* Meta Tags: Priority & Due Date */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold ${prio.color}`}
                            >
                              <span>{prio.icon}</span>
                              <span>{prio.label}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.dueAt || 'Today'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Edit & Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ----------------------------------------------------
              FEATURE 2: STUDY STREAK & ACTIVITY CALENDAR
          ---------------------------------------------------- */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Calendar Header & Streak Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                  <Flame className="w-5 h-5 fill-current text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                      Study Streak & Calendar
                    </h2>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {progress?.streak?.currentDays || 3} Days Active 🔥
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track daily revision, homework & assessment habits
                  </p>
                </div>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-display font-extrabold text-xs sm:text-sm text-slate-800 px-2 min-w-[120px] text-center">
                  {monthLabel}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Streak Milestone Achievements Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shadow-xs">
                  🔥
                </div>
                <div>
                  <div className="text-[10px] text-amber-800 font-extrabold uppercase">3-Day Flame</div>
                  <div className="text-xs font-bold text-slate-800">Unlocked! 🏆</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                  ⚡
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase">7-Day Habit</div>
                  <div className="text-xs font-bold text-slate-700">4 days to go</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                  👑
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase">14-Day Master</div>
                  <div className="text-xs font-bold text-slate-700">Next goal</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                  🌟
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase">Top Scholar</div>
                  <div className="text-xs font-bold text-slate-700">30-day glory</div>
                </div>
              </div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="space-y-2">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pb-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Days Cells */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((d, idx) => {
                  if (!d.isCurrentMonth) {
                    return (
                      <div
                        key={idx}
                        className="h-12 sm:h-14 rounded-xl bg-slate-50/40 border border-transparent"
                      />
                    );
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDay(d);
                        setShowDayModal(true);
                      }}
                      className={`h-12 sm:h-14 rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer relative text-left ${
                        d.isToday
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs ring-2 ring-orange-400/40'
                          : d.hasActivity
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50'
                          : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Day Number */}
                      <span
                        className={`text-xs font-bold ${
                          d.isToday
                            ? 'text-orange-600 font-extrabold'
                            : d.hasActivity
                            ? 'text-emerald-800'
                            : 'text-slate-700'
                        }`}
                      >
                        {d.dayNumber}
                      </span>

                      {/* Flame or Activity indicator */}
                      {d.hasActivity && (
                        <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 bg-amber-100/80 px-1 rounded">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          <span className="hidden sm:inline">{d.activityCount}</span>
                        </div>
                      )}

                      {d.isToday && (
                        <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-tighter block -mt-1">
                          Today
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200" />
                  <span>Today</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Study Goal Met</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span>Active Flame</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetToToday}
                className="text-orange-600 hover:underline font-bold text-xs"
              >
                Go to Today
              </button>
            </div>
          </section>

          {/* ----------------------------------------------------
              FEATURE 3: RECOMMENDED STUDY NOTE (CONTINUE LEARNING)
          ---------------------------------------------------- */}
          {recentNotes.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs border-l-4 border-l-orange-500 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {recentNotes[0].subjectName} · Core Note
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      {recentNotes[0].readTimeMinutes} min read
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-orange-600 transition-colors">
                    <Link to={`/app/notes/${recentNotes[0].id}`}>{recentNotes[0].title}</Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">
                    {recentNotes[0].summary}
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    to={`/app/notes/${recentNotes[0].id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm shadow-orange-500/20"
                  >
                    <span>Read Note Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ----------------------------------------------------
              FEATURE 4: TEACHER DOUBTS & SOLUTIONS FEED
          ---------------------------------------------------- */}
          {recentDoubts.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs border-l-4 border-l-teal-500 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Teacher Doubts & Step-by-Step Replies
                    </h3>
                    <p className="text-xs text-slate-500">
                      Recent queries answered by your tutor
                    </p>
                  </div>
                </div>

                <Link
                  to="/app/doubts"
                  className="text-xs text-teal-600 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Ask Tutor</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentDoubts.map((d) => (
                  <Link
                    key={d.id}
                    to={`/app/doubts/${d.id}`}
                    className="block p-3.5 rounded-2xl bg-teal-50/40 border border-teal-100 hover:border-teal-300 hover:bg-white transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700">{d.subjectName}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed">
                      {d.questionText}
                    </p>
                    {d.status === 'answered' && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tutor provided comprehensive ICSE Board solution</span>
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ====================================================
            RIGHT COLUMN (lg:col-span-5 xl:col-span-4)
        ==================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* 1. Practice Assessment Card */}
          {nextQuiz && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs border-t-4 border-t-amber-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Practice Assessment
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {Math.round(nextQuiz.durationSeconds / 60)} mins
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1 leading-snug">
                  {nextQuiz.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {nextQuiz.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {nextQuiz.latestAttemptScore !== null
                    ? `Last Score: ${nextQuiz.latestAttemptScore}/${nextQuiz.latestAttemptMax}`
                    : 'Ready for test'}
                </span>
                <Link
                  to={`/app/quizzes/${nextQuiz.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs"
                >
                  <span>{nextQuiz.latestAttemptScore !== null ? 'Retake Test' : 'Start Test'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* 2. Homework Due Desk */}
          {nextHomework && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs border-t-4 border-t-emerald-500 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Homework Due
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  This Week
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-slate-900 mb-1 leading-snug">
                  {nextHomework.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {nextHomework.instructions}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">{nextHomework.subjectName}</span>
                <Link
                  to={`/app/homework/${nextHomework.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                >
                  <span>Submit Work</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* 3. Mistake Notebook Shortcut */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs border-t-4 border-t-purple-500 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Mistake Revision Notebook
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Revision
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Review questions missed in past quizzes with detailed solutions and step-by-step ICSE Board explanations.
            </p>

            <Link
              to="/app/revision"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors"
            >
              <span>Practice Missed Questions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4. Science Watch Feed (Tutor Published) */}
          {news.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs border-t-4 border-t-orange-400 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Science & Space Watch
                  </h3>
                </div>
                <Link to="/app/news" className="text-xs text-orange-600 hover:underline font-bold">
                  All articles →
                </Link>
              </div>

              <div className="space-y-2.5">
                {news.map((item, idx) => (
                  <Link
                    key={idx}
                    to="/app/news"
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-400 hover:bg-white transition-all block group"
                  >
                    <span className="text-[10px] text-orange-600 font-extrabold uppercase tracking-wider block mb-0.5">
                      {item.source?.name || 'Science News'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          MODAL: ADD / EDIT TODO MISSION (FULL CRUD)
      ---------------------------------------------------- */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveTask}
            className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-5 shadow-2xl my-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {editingTask ? 'Edit Study Mission' : 'New Study Mission'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set subject, priority level, and target due date
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mission Title *
              </label>
              <input
                type="text"
                required
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="e.g. Read ICSE Board Chapter 1 Rational Numbers summary..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notes & Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="e.g. Focus on closure property and practice 3 test questions..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
              />
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <select
                value={taskFormData.subjectId}
                onChange={(e) => setTaskFormData({ ...taskFormData, subjectId: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
              >
                {SUBJECTS_META.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={taskFormData.priority}
                  onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="high">🔥 High Priority</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="low">🌿 Low</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Due</label>
                <input
                  type="text"
                  value={taskFormData.dueAt}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueAt: e.target.value })}
                  placeholder="e.g. Today, Tomorrow"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTask}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingTask ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Mission'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: CALENDAR DAY DETAIL INSPECTION
      ---------------------------------------------------- */}
      {showDayModal && selectedCalendarDay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    Day Activity Log
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedCalendarDay.dateStr}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                  <Flame className="w-4 h-4 text-amber-600 fill-current" />
                  <span>
                    {selectedCalendarDay.hasActivity
                      ? `Active Study Day (${selectedCalendarDay.activityCount} Activities)`
                      : 'Rest Day (No tasks recorded)'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  {selectedCalendarDay.hasActivity
                    ? 'Student completed planned study missions and quizzes to maintain active learning streak.'
                    : 'Plan ahead and complete your study missions today to keep the flame alive!'}
                </p>
              </div>

              {selectedCalendarDay.isToday && (
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Today is your active study milestone day!</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDayModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
