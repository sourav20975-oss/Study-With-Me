import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Award
} from 'lucide-react';

export function QuizResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'incorrect'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await api.get(`/quiz-attempts/${id}/result`);
        setResult(res);
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Calculating score and loading explanations...</p>
      </div>
    );
  }

  if (!result || !result.attempt) {
    return (
      <div className="py-12 text-center text-text-muted">
        <p>Result not found.</p>
        <Link to="/app/quizzes" className="text-accent underline text-xs mt-2 block">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const { attempt, quizTitle, questions } = result;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const incorrectCount = questions.filter((q) => !q.isCorrect && q.studentAnswer !== null).length;
  const unansweredCount = questions.filter((q) => q.studentAnswer === null).length;

  const filteredQuestions = filter === 'incorrect' ? questions.filter((q) => !q.isCorrect) : questions;

  const mins = Math.floor((attempt.timeSpentSeconds || 0) / 60);
  const secs = (attempt.timeSpentSeconds || 0) % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/app/quizzes"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </Link>

      {/* Score Summary Banner */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
              Quiz Evaluation Complete
            </span>
            <h1 className="font-editorial text-2xl font-bold text-text mt-0.5">
              {quizTitle}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Time: {mins}m {secs}s</span>
          </div>
        </div>

        {/* Score metrics */}
        <div className="grid grid-cols-4 gap-2 text-center py-2">
          <div className="p-3 rounded-md bg-page border border-border">
            <span className="text-[11px] text-text-muted block">Score</span>
            <span className="text-xl font-bold text-text">
              {attempt.score} <span className="text-xs text-text-muted">/ {attempt.maxScore}</span>
            </span>
          </div>
          <div className="p-3 rounded-md bg-page border border-border">
            <span className="text-[11px] text-text-muted block">Accuracy</span>
            <span className="text-xl font-bold text-accent">{attempt.accuracy}%</span>
          </div>
          <div className="p-3 rounded-md bg-success/5 border border-success/20">
            <span className="text-[11px] text-success block">Correct</span>
            <span className="text-xl font-bold text-success">{correctCount}</span>
          </div>
          <div className="p-3 rounded-md bg-danger/5 border border-danger/20">
            <span className="text-[11px] text-danger block">Mistakes</span>
            <span className="text-xl font-bold text-danger">{incorrectCount}</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-page border border-border text-text hover:bg-surface-muted'
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'incorrect'
                  ? 'bg-danger text-white'
                  : 'bg-page border border-border text-text hover:bg-surface-muted'
              }`}
            >
              Review Mistakes ({incorrectCount})
            </button>
          </div>

          <Link
            to="/app/revision"
            className="text-accent font-semibold hover:underline flex items-center gap-1"
          >
            <span>Mistake Notebook</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const isCorrect = q.isCorrect;
          const hasAnswered = q.studentAnswer !== null;

          return (
            <div
              key={q.id}
              className={`bg-surface rounded-lg border p-5 space-y-4 shadow-2xs ${
                isCorrect ? 'border-success/30' : 'border-danger/30'
              }`}
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-semibold text-text">
                  Question {idx + 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                    isCorrect
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct (+{q.marks})</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{hasAnswered ? 'Incorrect (0)' : 'Unanswered (0)'}</span>
                    </>
                  )}
                </span>
              </div>

              {/* Prompt */}
              <div className="text-sm sm:text-base font-medium text-text leading-relaxed">
                <MathRenderer content={q.prompt} />
              </div>

              {/* Options display with correct and student selection marked */}
              {q.options && q.options.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const optKey = String(optIdx);
                    const isSelectedByStudent = q.studentAnswer === optKey;
                    const isTheCorrectOption = String(q.correctAnswer) === optKey;

                    let rowStyle = 'bg-page border-border text-text-muted';
                    if (isTheCorrectOption) {
                      rowStyle = 'bg-success/10 border-success/40 text-success font-medium';
                    } else if (isSelectedByStudent && !isCorrect) {
                      rowStyle = 'bg-danger/10 border-danger/40 text-danger font-medium';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-md border text-xs sm:text-sm flex items-start gap-2.5 ${rowStyle}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0 font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <div className="flex-1">
                          <MathRenderer content={opt} />
                        </div>
                        {isTheCorrectOption && (
                          <span className="text-[11px] font-semibold text-success shrink-0">
                            ✓ Correct Answer
                          </span>
                        )}
                        {isSelectedByStudent && !isCorrect && (
                          <span className="text-[11px] font-semibold text-danger shrink-0">
                            ✗ Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs space-y-1 p-2.5 rounded bg-page border border-border">
                  <div>
                    <span className="text-text-muted">Your numerical response: </span>
                    <span className={`font-mono font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                      {q.studentAnswer || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Correct numerical answer: </span>
                    <span className="font-mono font-bold text-success">{q.correctAnswer}</span>
                  </div>
                </div>
              )}

              {/* Worked Explanation */}
              {q.explanation && (
                <div className="p-3.5 rounded-md bg-page border-l-3 border-accent text-xs space-y-1 mt-2">
                  <span className="font-semibold text-accent uppercase tracking-wider text-[11px] block">
                    Worked Explanation:
                  </span>
                  <div className="text-text leading-relaxed">
                    <MathRenderer content={q.explanation} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
