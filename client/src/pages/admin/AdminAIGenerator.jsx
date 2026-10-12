import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Save,
  CheckCheck,
  Zap,
  Sliders,
  FileText,
  Check,
  ArrowRight,
  ExternalLink,
  Layers,
  Plus,
  HelpCircle,
  Clock,
  BookOpen
} from 'lucide-react';

export function AdminAIGenerator() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [notes, setNotes] = useState([]);

  // Form states
  const [provider, setProvider] = useState('groq'); // 'groq' | 'gemini' | 'openrouter' | 'auto'
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [sourceMode, setSourceMode] = useState('settings'); // 'settings' | 'notes'
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('all');
  const [language, setLanguage] = useState('English');
  const [marks, setMarks] = useState(2);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [autoPublishDirectly, setAutoPublishDirectly] = useState(false);

  // Output review states
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [selectedDraftIndices, setSelectedDraftIndices] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [publishingIndex, setPublishingIndex] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [subRes, notesRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/notes')
        ]);
        setSubjects(subRes.subjects || []);
        setNotes(notesRes.notes || []);
        if (subRes.subjects?.length > 0) {
          setSelectedSubject(subRes.subjects[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadChapters() {
      if (!selectedSubject) return;
      try {
        const res = await api.get(`/subjects/${selectedSubject}/chapters`);
        setChapters(res.chapters || []);
        if (res.chapters?.length > 0) {
          setSelectedChapter(res.chapters[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadChapters();
  }, [selectedSubject]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setSaveSuccessMsg('');
    setSelectedDraftIndices([]);

    try {
      let res;
      if (sourceMode === 'notes' && selectedNoteId) {
        res = await api.post('/admin/ai/generate-from-notes', {
          noteId: selectedNoteId,
          count: parseInt(count),
          difficulty,
          marks: parseInt(marks)
        });
      } else {
        res = await api.post('/admin/ai/generate-questions', {
          provider,
          subjectId: selectedSubject,
          chapterId: selectedChapter,
          count: parseInt(count),
          difficulty,
          questionType,
          language,
          marks: parseInt(marks),
          includeExplanations,
          saveDirectly: autoPublishDirectly
        });
      }

      const generated = res.questions || [];

      if (autoPublishDirectly) {
        setSaveSuccessMsg(`Directly generated and published ${generated.length} questions into Question Bank!`);
        setDraftQuestions([]);
      } else {
        // Tag subject & chapter info to each draft
        const currSub = subjects.find((s) => s.id === selectedSubject);
        const currChap = chapters.find((c) => c.id === selectedChapter);

        const enriched = generated.map((q) => ({
          ...q,
          subjectId: q.subjectId || selectedSubject,
          subjectName: q.subjectName || currSub?.name || 'Mathematics',
          chapterId: q.chapterId || selectedChapter,
          chapterTitle: q.chapterTitle || currChap?.title || 'Chapter',
          reviewStatus: 'approved'
        }));

        setDraftQuestions(enriched);
      }
    } catch (err) {
      alert(err.message || 'AI Generation failed. Check API key or provider status.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish a SINGLE question to the Question Bank
  const handlePublishSingle = async (index) => {
    const q = draftQuestions[index];
    if (!q) return;

    setPublishingIndex(index);
    try {
      await api.post('/admin/ai/save-approved', {
        questions: [q]
      });

      setDraftQuestions((prev) => prev.filter((_, idx) => idx !== index));
      setSelectedDraftIndices((prev) => prev.filter((idx) => idx !== index));
      setSaveSuccessMsg(`Question published! It is now immediately LIVE in Student Quiz & Question Bank.`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to publish question to bank.');
    } finally {
      setPublishingIndex(null);
    }
  };

  // Publish Selected Questions
  const handlePublishSelected = async () => {
    if (selectedDraftIndices.length === 0) return;
    const toPublish = selectedDraftIndices.map((idx) => draftQuestions[idx]).filter(Boolean);

    setIsSavingAll(true);
    try {
      const res = await api.post('/admin/ai/save-approved', {
        questions: toPublish
      });

      setDraftQuestions((prev) => prev.filter((_, idx) => !selectedDraftIndices.includes(idx)));
      setSelectedDraftIndices([]);
      setSaveSuccessMsg(`Successfully published ${res.count} questions! LIVE in Student Chapter Quiz & Question Bank.`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      alert(err.message || 'Failed to publish selected questions.');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Publish ALL Questions
  const handleSaveAllToBank = async () => {
    if (draftQuestions.length === 0) return;
    setIsSavingAll(true);
    try {
      const res = await api.post('/admin/ai/save-approved', {
        questions: draftQuestions
      });

      setSaveSuccessMsg(`All ${res.count} questions approved! LIVE in Student Chapter Quiz & Question Bank.`);
      setDraftQuestions([]);
      setSelectedDraftIndices([]);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
    } catch (err) {
      alert(err.message || 'Failed to save questions to bank.');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Reject / Remove one draft
  const handleRejectOne = (index) => {
    setDraftQuestions((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedDraftIndices((prev) => prev.filter((idx) => idx !== index));
  };

  // Edit draft item
  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...draftQuestions[index] });
  };

  const handleSaveEdit = () => {
    setDraftQuestions((prev) =>
      prev.map((q, idx) => (idx === editingIndex ? { ...editForm } : q))
    );
    setEditingIndex(null);
    setEditForm(null);
  };

  // Checkbox toggle
  const handleToggleSelectDraft = (index) => {
    setSelectedDraftIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllDrafts = () => {
    if (selectedDraftIndices.length === draftQuestions.length) {
      setSelectedDraftIndices([]);
    } else {
      setSelectedDraftIndices(draftQuestions.map((_, idx) => idx));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20">
              AI Assessment Lab
            </span>
            <span className="text-xs text-text-muted font-medium">ICSE Class 8</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Multi-AI Question Generator & Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Draft rigorous ICSE questions with LaTeX math and solutions, review them, and publish directly to the Question Bank.
          </p>
        </div>

        <Link
          to="/admin/questions"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-page hover:bg-surface text-text text-xs font-bold transition-colors shrink-0 shadow-2xs"
        >
          <BookOpen className="w-4 h-4 text-accent" />
          <span>Go to Question Bank</span>
        </Link>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleGenerate} className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-editorial text-base font-bold text-text flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Generation Parameters</span>
          </h3>

          {/* AI Provider selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-text-muted hidden sm:inline">Engine:</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded-xl text-xs font-bold bg-page text-text focus:outline-hidden focus:border-accent"
            >
              <option value="groq">Groq (High-Speed Engine - Recommended)</option>
              <option value="gemini">Google Gemini Flash</option>
              <option value="openrouter">OpenRouter API</option>
              <option value="auto">Auto (Best Available)</option>
            </select>
          </div>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSourceMode('settings')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              sourceMode === 'settings'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-page border border-border text-text hover:bg-surface'
            }`}
          >
            Curriculum Parameters
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('notes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              sourceMode === 'notes'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-page border border-border text-text hover:bg-surface'
            }`}
          >
            Extract from Published Notes
          </button>
        </div>

        {sourceMode === 'settings' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                Target Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
              >
                <option value="easy">Easy (Definitions & Recalls)</option>
                <option value="medium">Medium (Step Solving)</option>
                <option value="hard">Hard (Multi-step application)</option>
                <option value="mixed">Mixed Distribution</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
              Select Source Note to Synthesize Questions:
            </label>
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
            >
              <option value="">-- Choose a published note --</option>
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.subjectName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Counts & Marks Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">Count (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
            >
              <option value="all">All Types</option>
              <option value="single_select">Multiple Choice (MCQ)</option>
              <option value="numerical">Numerical Answer</option>
              <option value="true_false">True / False</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">Marks per Question</label>
            <input
              type="number"
              min={1}
              max={5}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text">
              <input
                type="checkbox"
                id="inclExp"
                checked={includeExplanations}
                onChange={(e) => setIncludeExplanations(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent accent-accent cursor-pointer"
              />
              <span>Include Worked Solutions</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700">
              <input
                type="checkbox"
                checked={autoPublishDirectly}
                onChange={(e) => setAutoPublishDirectly(e.target.checked)}
                className="h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <span>Publish directly to Bank</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-extrabold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-accent/20 active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Questions...' : 'Generate Draft Questions'}</span>
          </button>
        </div>
      </form>

      {/* Save Success Banner with Direct Link to Question Bank */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/questions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors shrink-0 shadow-2xs"
            >
              <span>View in Bank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/app/quizzes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold transition-colors shrink-0 shadow-2xs"
            >
              <span>Open Student Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Review Queue */}
      {draftQuestions.length > 0 && (
        <section className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg sm:text-xl font-bold text-text">
                  AI Review Queue ({draftQuestions.length} Drafts)
                </span>
                <StatusBadge status="ai_draft" />
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Review each draft below. You can publish individually or approve all to the question bank.
              </p>
            </div>

            {/* Bulk Publish Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedDraftIndices.length > 0 && (
                <button
                  type="button"
                  onClick={handlePublishSelected}
                  disabled={isSavingAll}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Selected ({selectedDraftIndices.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveAllToBank}
                disabled={isSavingAll}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isSavingAll ? 'Publishing...' : `Approve & Publish All (${draftQuestions.length}) to Bank`}</span>
              </button>
            </div>
          </div>

          {/* Select all bar */}
          <div className="flex items-center justify-between text-xs text-text-muted pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold select-none hover:text-text">
              <input
                type="checkbox"
                checked={selectedDraftIndices.length === draftQuestions.length}
                onChange={handleSelectAllDrafts}
                className="h-4 w-4 rounded border-border text-accent accent-accent cursor-pointer"
              />
              <span>Select All Drafts ({draftQuestions.length})</span>
            </label>

            <span>Click green "Publish to Bank" on any question to add it immediately.</span>
          </div>

          <div className="space-y-4">
            {draftQuestions.map((q, idx) => {
              const isEditing = editingIndex === idx;
              const isSelected = selectedDraftIndices.includes(idx);
              const isPublishingThis = publishingIndex === idx;

              return (
                <div
                  key={q.id || idx}
                  className={`p-5 rounded-2xl border space-y-3.5 transition-all ${
                    isSelected ? 'bg-accent-soft/20 border-accent' : 'bg-page/70 border-border'
                  }`}
                >
                  {/* Card Header with Single Publish Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectDraft(idx)}
                        className="h-4 w-4 rounded border-border text-accent accent-accent cursor-pointer"
                      />

                      <span className="font-extrabold text-text">Draft #{idx + 1}</span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted capitalize">
                        {q.difficulty} • {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </span>

                      {q.subjectName && (
                        <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider">
                          {q.subjectName} • {q.chapterTitle}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Publish, Edit, Reject */}
                    <div className="flex items-center gap-2">
                      {/* PRIMARY PUBLISH BUTTON */}
                      <button
                        type="button"
                        onClick={() => handlePublishSingle(idx)}
                        disabled={isPublishingThis || isSavingAll}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        title="Publish this question to Question Bank"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{isPublishingThis ? 'Publishing...' : 'Publish to Bank'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-surface rounded-lg border border-border transition-colors"
                        title="Edit Question before publishing"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectOne(idx)}
                        className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-border transition-colors"
                        title="Reject and remove draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    // Edit Form
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-1">
                          Question Prompt:
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.prompt}
                          onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                          className="w-full p-2.5 border border-border rounded-xl text-xs bg-surface font-mono"
                        />
                      </div>

                      {editForm.options && editForm.options.length > 0 && (
                        <div>
                          <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-1">
                            Options:
                          </label>
                          <div className="space-y-1.5">
                            {editForm.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-text-muted">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...editForm.options];
                                    newOpts[oIdx] = e.target.value;
                                    setEditForm({ ...editForm, options: newOpts });
                                  }}
                                  className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-surface"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-1">
                            Correct Answer Index (0 for A, 1 for B...):
                          </label>
                          <input
                            type="text"
                            value={editForm.correctAnswer}
                            onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-surface font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-1">
                            Difficulty:
                          </label>
                          <select
                            value={editForm.difficulty}
                            onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-border rounded-lg text-xs bg-surface font-bold"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-1">
                          Worked Explanation:
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.explanation}
                          onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                          className="w-full p-2.5 border border-border rounded-xl text-xs bg-surface"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs text-text font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-bold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display View
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-text leading-relaxed">
                        <MathRenderer content={q.prompt} />
                      </div>

                      {/* Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = String(q.correctAnswer) === String(oIdx);
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-surface border-border text-text'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="truncate">
                                    <MathRenderer content={opt} />
                                  </span>
                                </div>
                                {isCorrect && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-surface border-l-4 border-accent text-xs space-y-1">
                          <span className="font-extrabold text-accent uppercase tracking-wider text-[10px] block">
                            Worked Solution:
                          </span>
                          <div className="text-text leading-relaxed">
                            <MathRenderer content={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Publish All Button */}
          <div className="flex items-center justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleSaveAllToBank}
              disabled={isSavingAll}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{isSavingAll ? 'Publishing All...' : `Approve & Publish All (${draftQuestions.length}) to Question Bank`}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
