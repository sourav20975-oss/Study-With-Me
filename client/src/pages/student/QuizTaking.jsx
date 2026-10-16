import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck
} from 'lucide-react';

export function QuizTaking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> answer string
  const [timeLeft, setTimeLeft] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizData() {
      try {
        const res = await api.get(`/quizzes/${id}`);
        setQuiz(res.quiz);
      } catch (err) {
        console.error('Failed to load quiz:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuizData();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const handleStartQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/quizzes/${id}/attempts`, {});
      setAttempt(res.attempt);
      setTimeLeft(quiz.durationSeconds || 600);
      setIsStarted(true);
    } catch (err) {
      alert(err.message || 'Could not start quiz attempt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || !attempt) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans
      }));

      const timeSpent = (quiz.durationSeconds || 600) - (timeLeft || 0);

      const res = await api.post(`/quiz-attempts/${attempt.id}/submit`, {
        answers: formattedAnswers,
        timeSpentSeconds: timeSpent
      });

      navigate(`/app/quiz-attempts/${res.attempt.id}/result`);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Preparing test environment...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-12 text-center text-text-muted">
        <p>Quiz not found.</p>
        <Link to="/app/quizzes" className="text-accent underline text-xs mt-2 block">
          Back to quizzes
        </Link>
      </div>
    );
  }

  // --- 1. INTRO SCREEN ---
  if (!isStarted) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          to="/app/quizzes"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quizzes</span>
        </Link>

        <div className="bg-surface rounded-lg border border-border p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider block mb-1">
              {quiz.subjectName} · Assessment Rules
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-text">
              {quiz.title}
            </h1>
            <p className="text-sm text-text-muted mt-2">
              {quiz.description || 'Test your knowledge on key principles, formulas, and definitions.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-md bg-page border border-border text-center">
            <div>
              <span className="text-[11px] text-text-muted block">Questions</span>
              <span className="text-base font-bold text-text">{quiz.questions.length}</span>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Duration</span>
              <span className="text-base font-bold text-text">
                {Math.round((quiz.durationSeconds || 600) / 60)} mins
              </span>
            </div>
            <div>
              <span className="text-[11px] text-text-muted block">Attempts</span>
              <span className="text-base font-bold text-text">
                {quiz.attemptsCount} / {quiz.attemptLimit || '∞'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-text-muted border-t border-border pt-4">
            <h4 className="font-semibold text-text">Instructions before you begin:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>You can change your selected answers anytime before final submission.</li>
              <li>Questions are scored on the server upon clicking "Submit Test".</li>
              <li>Worked step-by-step solutions and explanations will be revealed immediately after submission.</li>
            </ul>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={!quiz.hasAttemptsRemaining}
            className="w-full py-3 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>Start Practice Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- 2. ACTIVE TEST TAKING SCREEN ---
  const currentQ = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Test Sticky Top Navigation */}
      <div className="bg-surface p-3.5 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text">
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-xs text-text-muted">
            ({answeredCount} answered)
          </span>
        </div>

        {timeLeft !== null && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold ${
              timeLeft < 120
                ? 'bg-danger/10 text-danger animate-pulse'
                : 'bg-page border border-border text-text'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="bg-surface rounded-lg border border-border p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-medium text-text-muted">
            Marks: {currentQ.marks ?? 1} · {(currentQ.difficulty || 'Medium').toUpperCase()}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-text-muted capitalize">
            {(currentQ.type || 'single_select').replace('_', ' ')}
          </span>
        </div>

        {/* Prompt */}
        <div className="text-base sm:text-lg font-medium text-text leading-relaxed">
          <MathRenderer content={currentQ.prompt} />
        </div>

        {/* Options / Input */}
        <div className="space-y-2.5 pt-2">
          {(!currentQ.type || currentQ.type === 'single_select' || currentQ.type === 'true_false') ? (
            (currentQ.options || []).map((opt, optIdx) => {
              const optKey = String(optIdx);
              const isSelected = answers[currentQ.id] === optKey;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQ.id, optKey)}
                  className={`w-full text-left p-3.5 rounded-md border text-sm transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-accent-soft border-accent text-accent-hover font-medium shadow-2xs'
                      : 'bg-page border-border text-text hover:border-text-muted hover:bg-surface-muted/50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-accent bg-accent text-white font-bold'
                        : 'border-border text-text-muted bg-surface'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <div className="flex-1">
                    <MathRenderer content={opt} />
                  </div>
                </button>
              );
            })
          ) : (
            // Numerical / short text answer
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-muted">
                Enter your numerical answer:
              </label>
              <input
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                placeholder="e.g. 15 or 0"
                className="w-full px-3 py-2.5 border border-border rounded-md text-sm bg-page focus:bg-surface focus:outline-hidden focus:border-accent font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Question Controls & Submit */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg border border-border bg-surface text-text text-xs font-medium hover:bg-surface-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
              className="px-5 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-accent/25 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Submit Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal before final submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-text/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-editorial text-lg font-bold text-text">
              Submit Quiz?
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              You have answered <span className="font-semibold text-text">{answeredCount}</span> of{' '}
              <span className="font-semibold text-text">{quiz.questions.length}</span> questions.
              Once submitted, your answers will be scored immediately.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-text hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Scoring...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
