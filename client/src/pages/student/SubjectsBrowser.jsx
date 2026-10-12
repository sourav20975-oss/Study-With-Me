import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  ChevronRight,
  FileText,
  CheckSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  Award,
  Clock,
  Trophy,
  ArrowRight,
  Star,
  Check
} from 'lucide-react';

const SUBJECT_STYLES = {
  'mathematics': {
    accent: 'bg-orange-500 text-white',
    tile: 'hover:border-orange-400 hover:bg-orange-50/40',
    selected: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20',
    iconColor: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    btn: 'bg-orange-500 hover:bg-orange-600'
  },
  'science': {
    accent: 'bg-teal-600 text-white',
    tile: 'hover:border-teal-400 hover:bg-teal-50/40',
    selected: 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-600 shadow-md shadow-teal-600/20',
    iconColor: 'text-teal-600',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    btn: 'bg-teal-600 hover:bg-teal-700'
  },
  'english': {
    accent: 'bg-amber-600 text-white',
    tile: 'hover:border-amber-400 hover:bg-amber-50/40',
    selected: 'bg-gradient-to-br from-amber-600 to-yellow-600 text-white border-amber-600 shadow-md shadow-amber-600/20',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    btn: 'bg-amber-600 hover:bg-amber-700'
  },
  'social-science': {
    accent: 'bg-sky-600 text-white',
    tile: 'hover:border-sky-400 hover:bg-sky-50/40',
    selected: 'bg-gradient-to-br from-sky-600 to-indigo-600 text-white border-sky-600 shadow-md shadow-sky-600/20',
    iconColor: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    btn: 'bg-sky-600 hover:bg-sky-700'
  }
};

const ICON_MAP = {
  calculator: Calculator,
  'flask-conical': FlaskConical,
  'book-open': BookOpen,
  globe: Globe
};

export function SubjectsBrowser() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [notes, setNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded questions per chapter: { [chapterId]: boolean }
  const [expandedChapterQuestions, setExpandedChapterQuestions] = useState({});

  // Practice state for interactive solving: { [questionId]: { selectedOption: string, isChecked: boolean, showExplanation: boolean } }
  const [practiceState, setPracticeState] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const subRes = await api.get('/subjects');
        setSubjects(subRes.subjects || []);

        const targetSubId = subjectId || subRes.subjects?.[0]?.id;
        if (targetSubId) {
          const detailRes = await api.get(`/subjects/${targetSubId}?role=student`);
          setActiveSubject(detailRes.subject);
          setChapters(detailRes.chapters || []);

          const [notesRes, questionsRes, quizzesRes] = await Promise.all([
            api.get(`/notes?subjectId=${targetSubId}&role=student`).catch(() => ({ notes: [] })),
            api.get(`/questions?subjectId=${targetSubId}`).catch(() => ({ questions: [] })),
            api.get('/quizzes').catch(() => ({ quizzes: [] }))
          ]);

          setNotes(notesRes.notes || []);
          setQuestions(questionsRes.questions || []);
          setQuizzes(quizzesRes.quizzes || []);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [subjectId]);

  const toggleChapterQuestions = (chapId) => {
    setExpandedChapterQuestions((prev) => ({
      ...prev,
      [chapId]: !prev[chapId]
    }));
  };

  const handleSelectOption = (questionId, optIndex) => {
    setPracticeState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption: String(optIndex)
      }
    }));
  };

  const handleCheckAnswer = (questionId) => {
    setPracticeState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isChecked: true,
        showExplanation: true
      }
    }));
  };

  const toggleExplanation = (questionId) => {
    setPracticeState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        showExplanation: !prev[questionId]?.showExplanation
      }
    }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Opening subject syllabus & quizzes...</p>
      </div>
    );
  }

  const activeStyle =
    SUBJECT_STYLES[activeSubject?.slug] || SUBJECT_STYLES['mathematics'];

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* ----------------------------------------------------
          1. HERO HEADER BANNER
      ---------------------------------------------------- */}
      <section className="bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/25">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Class 8 ICSE Board Official Syllabus</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Verified Notes & Quizzes</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Class 8 Subjects & Syllabus Explorer
            </h1>

            <p className="text-xs sm:text-sm text-orange-50 font-medium leading-relaxed">
              Explore syllabus chapters, study verified ICSE concept notes, and practice interactive chapter quizzes with step-by-step solutions.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Subjects
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-white">
                {subjects.length} Core
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Total Chapters
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-amber-300">
                {subjects.reduce((acc, s) => acc + (s.chapterCount || 0), 0)} Chapters
              </span>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 px-4 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider block">
                Core Notes
              </span>
              <span className="text-xl sm:text-2xl font-black font-display leading-tight text-emerald-300">
                {notes.length} Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. FOUR SUBJECT SELECTOR TILES (Ultra Modern)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {subjects.map((sub) => {
          const isCurrent = activeSubject?.id === sub.id;
          const style = SUBJECT_STYLES[sub.slug] || SUBJECT_STYLES['mathematics'];
          const Icon = ICON_MAP[sub.icon] || BookOpen;

          return (
            <Link
              key={sub.id}
              to={`/app/subjects/${sub.id}`}
              className={`p-5 rounded-3xl border text-left transition-all flex flex-col justify-between shadow-xs ${
                isCurrent
                  ? `${style.selected}`
                  : `bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5`
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 ' + style.iconColor
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isCurrent ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {sub.noteCount} notes • {sub.questionCount || 0} Qs
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-base sm:text-lg leading-snug">
                  {sub.name}
                </h3>
                <span
                  className={`text-xs block mt-1 ${
                    isCurrent ? 'text-white/90 font-medium' : 'text-slate-500 font-normal'
                  }`}
                >
                  {sub.chapterCount} chapters published
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ----------------------------------------------------
          3. ACTIVE SUBJECT CHAPTERS, NOTES & QUIZZES
      ---------------------------------------------------- */}
      {activeSubject && (
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 space-y-6 shadow-xs">
          {/* Active Subject Banner */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${activeStyle.badge}`}
              >
                ICSE Class 8 Syllabus
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {chapters.length} Chapters Published
              </span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              {activeSubject.name} Chapters
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {activeSubject.description}
            </p>
          </div>

          {/* Chapters List */}
          {chapters.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl p-6">
              No chapters published yet for this subject.
            </div>
          ) : (
            <div className="space-y-6">
              {chapters.map((chap) => {
                const chapNotes = notes.filter((n) => n.chapterId === chap.id);
                const chapQuestions = questions.filter((q) => q.chapterId === chap.id);
                const chapQuiz =
                  quizzes.find((q) => q.chapterId === chap.id) ||
                  quizzes.find((q) => q.subjectId === activeSubject.id);
                const isQuestionsExpanded = !!expandedChapterQuestions[chap.id];

                return (
                  <div
                    key={chap.id}
                    className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 border border-slate-200/90 space-y-5 transition-all hover:bg-white hover:shadow-xs"
                  >
                    {/* Chapter Header */}
                    <div>
                      <div className="text-[11px] font-extrabold text-orange-600 uppercase tracking-wider mb-1">
                        Chapter {chap.sortOrder}
                      </div>
                      <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-snug">
                        {chap.title}
                      </h3>
                      {chap.description && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          {chap.description}
                        </p>
                      )}
                    </div>

                    {/* Section 1: Available Chapter Notes */}
                    <div className="pt-3 border-t border-slate-200/70 space-y-2.5">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                        <span>Available Chapter Notes:</span>
                      </div>

                      {chapNotes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Notes for this chapter are currently being finalized by tutor Sourav Kumar.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {chapNotes.map((note) => (
                            <Link
                              key={note.id}
                              to={`/app/notes/${note.id}`}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-xs transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-orange-600 truncate">
                                  {note.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {note.readTimeMinutes} min read
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Chapter Practice Quiz & Questions */}
                    <div className="pt-3 border-t border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chapter Practice & Quizzes:</span>
                        </div>

                        {chapQuestions.length > 0 && (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {chapQuestions.length} Questions Live
                          </span>
                        )}
                      </div>

                      {chapQuestions.length > 0 || chapQuiz ? (
                        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-600 text-white uppercase tracking-wider">
                                  ICSE Assessment
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {chapQuestions.length || chapQuiz?.questionCount || 0} Questions • Instant Worked Solutions
                                </span>
                              </div>
                              <h4 className="font-bold text-sm sm:text-base text-slate-900">
                                {chapQuiz?.title || `${chap.title} Practice Test`}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {chapQuiz?.description || 'Multiple choice questions with step-by-step worked solutions.'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Direct Start Quiz Button */}
                              {chapQuiz && (
                                <Link
                                  to={`/app/quizzes/${chapQuiz.id}`}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Start Quiz</span>
                                </Link>
                              )}

                              {/* Toggle Practice Questions inline */}
                              {chapQuestions.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleChapterQuestions(chap.id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                                >
                                  <span>{isQuestionsExpanded ? 'Hide Questions' : `Practice (${chapQuestions.length})`}</span>
                                  {isQuestionsExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Questions Inline Practice */}
                          {isQuestionsExpanded && chapQuestions.length > 0 && (
                            <div className="pt-3 border-t border-slate-100 space-y-4">
                              <div className="text-xs font-bold text-slate-600">
                                Select an option below to test your understanding:
                              </div>

                              <div className="space-y-3">
                                {chapQuestions.map((q, qIdx) => {
                                  const state = practiceState[q.id] || {};
                                  const isSelected = (optIdx) => state.selectedOption === String(optIdx);
                                  const isCorrectAnswer = (optIdx) => String(q.correctAnswer) === String(optIdx);
                                  const isChecked = state.isChecked;

                                  return (
                                    <div
                                      key={q.id || qIdx}
                                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                                    >
                                      {/* Question Prompt */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                          <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                                            Q{qIdx + 1}
                                          </span>
                                          <div className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug">
                                            <MathRenderer content={q.prompt} />
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase shrink-0">
                                          {q.marks || 1} M
                                        </span>
                                      </div>

                                      {/* Options */}
                                      {Array.isArray(q.options) && q.options.length > 0 && (
                                        <div className="space-y-2 pl-6">
                                          {q.options.map((opt, optIdx) => {
                                            const selected = isSelected(optIdx);
                                            const correct = isCorrectAnswer(optIdx);

                                            let btnClass = "border-slate-200 bg-white hover:border-slate-300 text-slate-700";
                                            if (isChecked) {
                                              if (correct) {
                                                btnClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                                              } else if (selected && !correct) {
                                                btnClass = "border-rose-400 bg-rose-50 text-rose-800";
                                              }
                                            } else if (selected) {
                                              btnClass = "border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold";
                                            }

                                            return (
                                              <button
                                                key={optIdx}
                                                type="button"
                                                onClick={() => handleSelectOption(q.id, optIdx)}
                                                className={`w-full p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${btnClass}`}
                                              >
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                  isChecked && correct
                                                    ? 'bg-emerald-600 text-white'
                                                    : isChecked && selected && !correct
                                                    ? 'bg-rose-500 text-white'
                                                    : selected
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                  {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <div className="flex-1 font-medium">
                                                  <MathRenderer content={opt} />
                                                </div>
                                                {isChecked && correct && (
                                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                )}
                                                {isChecked && selected && !correct && (
                                                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Action Buttons: Check Answer & View Solution */}
                                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                        <div className="flex items-center gap-2">
                                          {!isChecked ? (
                                            <button
                                              type="button"
                                              onClick={() => handleCheckAnswer(q.id)}
                                              disabled={state.selectedOption === undefined}
                                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                                            >
                                              Check Answer
                                            </button>
                                          ) : (
                                            <span className={`text-xs font-bold flex items-center gap-1 ${
                                              String(state.selectedOption) === String(q.correctAnswer)
                                                ? 'text-emerald-700'
                                                : 'text-rose-600'
                                            }`}>
                                              {String(state.selectedOption) === String(q.correctAnswer) ? (
                                                <>
                                                  <CheckCircle2 className="w-4 h-4" />
                                                  <span>Correct! Well done.</span>
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle className="w-4 h-4" />
                                                  <span>Incorrect. Correct was ({String.fromCharCode(65 + parseInt(q.correctAnswer || 0))}).</span>
                                                </>
                                              )}
                                            </span>
                                          )}
                                        </div>

                                        {q.explanation && (
                                          <button
                                            type="button"
                                            onClick={() => toggleExplanation(q.id)}
                                            className="text-xs font-bold text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                                          >
                                            {state.showExplanation ? 'Hide Explanation' : 'View Worked Solution'}
                                          </button>
                                        )}
                                      </div>

                                      {/* Explanation View */}
                                      {state.showExplanation && q.explanation && (
                                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-1">
                                          <div className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>ICSE Step-by-Step Worked Solution:</span>
                                          </div>
                                          <MathRenderer content={q.explanation} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Practice questions and quizzes for this chapter are currently being prepared by tutor Sourav Kumar.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default SubjectsBrowser;
