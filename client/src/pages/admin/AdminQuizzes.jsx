import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  CheckSquare,
  Plus,
  Clock,
  Trash2,
  CheckCircle,
  Eye,
  FileCheck,
  X
} from 'lucide-react';

export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Create quiz modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newAttemptLimit, setNewAttemptLimit] = useState(3);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [qRes, bankRes, sRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/admin/questions?reviewStatus=approved'),
        api.get('/subjects')
      ]);
      setQuizzes(qRes.quizzes || []);
      setQuestions(bankRes.questions || []);
      setSubjects(sRes.subjects || []);
      if (sRes.subjects?.length > 0 && !newSubjectId) {
        setNewSubjectId(sRes.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuiz = async (publishNow = true) => {
    if (!newTitle.trim() || !newSubjectId || selectedQuestionIds.length === 0) {
      alert('Please fill title, subject, and select at least one question.');
      return;
    }

    try {
      const refs = selectedQuestionIds.map((qId, idx) => ({
        questionId: qId,
        marks: 2,
        order: idx + 1
      }));

      await api.post('/admin/quizzes', {
        title: newTitle.trim(),
        description: newDesc.trim(),
        subjectId: newSubjectId,
        questionRefs: refs,
        durationSeconds: parseInt(newDuration) * 60,
        attemptLimit: parseInt(newAttemptLimit),
        status: publishNow ? 'published' : 'draft'
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setSelectedQuestionIds([]);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create quiz.');
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
      await api.patch(`/admin/quizzes/${quiz.id}`, { status: nextStatus });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update quiz status.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/admin/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.message || 'Failed to delete quiz.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading quiz management console...</p>
      </div>
    );
  }

  const filteredBank = newSubjectId
    ? questions.filter((q) => q.subjectId === newSubjectId)
    : questions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Quiz Management & Test Publishing
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Assemble practice tests from your approved question bank, set timers and attempt limits.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Build New Quiz</span>
        </button>
      </div>

      {/* Quizzes List */}
      <div className="bg-surface rounded-lg border border-border divide-y divide-border overflow-hidden shadow-2xs">
        {quizzes.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">
            No quizzes created yet. Click "Build New Quiz" above.
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-page/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    {quiz.subjectName}
                  </span>
                  <StatusBadge status={quiz.status} />
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.round(quiz.durationSeconds / 60)} mins
                  </span>
                </div>

                <h3 className="font-semibold text-base text-text">
                  {quiz.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-1">
                  {quiz.description || 'Practice quiz'}
                </p>

                <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
                  <span>{quiz.questionRefs?.length || 0} Questions</span>
                  <span>•</span>
                  <span>Attempt Limit: {quiz.attemptLimit || 'Unlimited'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(quiz)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    quiz.status === 'published'
                      ? 'border border-border bg-page hover:bg-surface-muted text-text'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {quiz.status === 'published' ? 'Unpublish' : 'Publish Test'}
                </button>

                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="p-1.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Build Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-text/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-border p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-xl">
            <h3 className="font-editorial text-lg font-bold text-text">
              Build Practice Test
            </h3>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Quiz Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Chapter 1 & 2 Rapid Assessment"
                className="w-full px-3 py-2 border border-border rounded text-sm bg-page"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Subject</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded text-xs bg-page"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded text-xs bg-page"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Attempt Limit</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newAttemptLimit}
                  onChange={(e) => setNewAttemptLimit(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded text-xs bg-page"
                />
              </div>
            </div>

            {/* Select Questions from Bank */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-text">
                  Select Questions from Approved Bank ({selectedQuestionIds.length} selected):
                </label>
              </div>

              <div className="max-h-56 overflow-y-auto border border-border rounded p-2 space-y-1.5 bg-page">
                {filteredBank.length === 0 ? (
                  <p className="text-xs text-text-muted italic p-2">
                    No approved questions found for this subject. Create questions or approve drafts in Question Bank first.
                  </p>
                ) : (
                  filteredBank.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionIds((prev) =>
                            isSelected ? prev.filter((i) => i !== q.id) : [...prev, q.id]
                          );
                        }}
                        className={`p-2 rounded text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent-soft border border-accent text-accent-hover font-medium'
                            : 'bg-surface border border-border text-text hover:border-text-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 accent-accent"
                        />
                        <div className="flex-1 truncate">
                          <span className="font-semibold">{q.chapterTitle}: </span>
                          <span>{q.prompt.replace(/\\\(|\\\)|\\\[|\\\]/g, '')}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-border text-xs text-text hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateQuiz(false)}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-page hover:bg-surface-muted text-xs font-semibold text-text transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleCreateQuiz(true)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
              >
                Publish & Make Live ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
