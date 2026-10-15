import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  CheckCheck,
  Sparkles,
  Sliders,
  Edit2,
  Copy,
  UploadCloud,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  ChevronRight,
  Image,
  Check,
  AlertCircle,
  ArrowRight,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';

export function AdminQuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Question Create / Edit Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalChapters, setModalChapters] = useState([]);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const initialQuestionState = {
    id: null,
    subjectId: '',
    chapterId: '',
    type: 'single_select',
    prompt: '',
    options: ['', '', '', ''],
    correctAnswer: '0',
    explanation: '',
    difficulty: 'medium',
    marks: 1,
    negativeMarks: 0,
    reviewStatus: 'approved'
  };

  const [questionForm, setQuestionForm] = useState(initialQuestionState);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState('csv'); // 'csv' | 'json'
  const [bulkText, setBulkText] = useState('');
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState([]);
  const [bulkError, setBulkError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const [loading, setLoading] = useState(true);
  const promptInputRef = useRef(null);
  const explanationInputRef = useRef(null);

  // 1. Initial Data Fetch
  const loadData = async () => {
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (filterSubject) query += `&subjectId=${filterSubject}`;
      if (filterChapter) query += `&chapterId=${filterChapter}`;
      if (filterDifficulty) query += `&difficulty=${filterDifficulty}`;
      if (filterStatus) query += `&reviewStatus=${filterStatus}`;
      if (filterType) query += `&type=${filterType}`;

      const [qRes, sRes] = await Promise.all([
        api.get(`/admin/questions${query}`),
        api.get('/subjects')
      ]);

      setQuestions(qRes.questions || []);
      setSubjects(sRes.subjects || []);

      if (sRes.subjects?.length > 0 && !filterSubject) {
        // chapters will be loaded as needed
      }
    } catch (e) {
      console.error('Failed to load questions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filterSubject, filterChapter, filterDifficulty, filterStatus, filterType]);

  // Load chapters for filter when filterSubject changes
  useEffect(() => {
    async function loadFilterChapters() {
      if (!filterSubject) {
        setChapters([]);
        setFilterChapter('');
        return;
      }
      try {
        const res = await api.get(`/subjects/${filterSubject}/chapters`);
        setChapters(res.chapters || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadFilterChapters();
  }, [filterSubject]);

  // Load chapters for Modal when questionForm.subjectId changes
  useEffect(() => {
    async function loadModalChaps() {
      if (!questionForm.subjectId) {
        setModalChapters([]);
        return;
      }
      try {
        const res = await api.get(`/subjects/${questionForm.subjectId}/chapters`);
        const chaps = res.chapters || [];
        setModalChapters(chaps);
        if (chaps.length > 0 && !questionForm.chapterId) {
          setQuestionForm((prev) => ({ ...prev, chapterId: chaps[0].id }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadModalChaps();
  }, [questionForm.subjectId]);

  // Bulk Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} questions?`);
      if (!confirmed) return;
    }

    try {
      await api.post('/admin/questions/bulk-review', {
        questionIds: selectedIds,
        action
      });
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      alert(err.message || 'Bulk action failed.');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    const defaultSubject = filterSubject || subjects[0]?.id || '';
    setQuestionForm({
      ...initialQuestionState,
      subjectId: defaultSubject,
      chapterId: filterChapter || ''
    });
    setUploadError('');
    setShowQuestionModal(true);
  };

  // Open Edit Modal
  const openEditModal = (q) => {
    setModalMode('edit');
    setQuestionForm({
      id: q.id,
      subjectId: q.subjectId || '',
      chapterId: q.chapterId || '',
      type: q.type || 'single_select',
      prompt: q.prompt || '',
      options: Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : ['', '', '', ''],
      correctAnswer: String(q.correctAnswer ?? '0'),
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      reviewStatus: q.reviewStatus || 'approved'
    });
    setUploadError('');
    setShowQuestionModal(true);
  };

  // Clone Question
  const handleCloneQuestion = (q) => {
    setModalMode('create');
    setQuestionForm({
      ...initialQuestionState,
      id: null,
      subjectId: q.subjectId || '',
      chapterId: q.chapterId || '',
      type: q.type || 'single_select',
      prompt: `${q.prompt} (Variation)`,
      options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
      correctAnswer: String(q.correctAnswer ?? '0'),
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      reviewStatus: 'approved'
    });
    setUploadError('');
    setShowQuestionModal(true);
  };

  // Delete Single Question
  const handleDeleteQuestion = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this question?');
    if (!confirmed) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  // 1-Click Toggle Status (Approve / Reject)
  const handleToggleStatus = async (q) => {
    const nextStatus = q.reviewStatus === 'approved' ? 'needs_review' : 'approved';
    try {
      await api.patch(`/admin/questions/${q.id}`, { reviewStatus: nextStatus });
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, reviewStatus: nextStatus } : item))
      );
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  // Save Question Form (Create or Edit)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.prompt.trim()) {
      alert('Please enter a question prompt.');
      return;
    }
    if (!questionForm.subjectId) {
      alert('Please select a subject.');
      return;
    }
    if (!questionForm.chapterId) {
      alert('Please select a chapter.');
      return;
    }

    setIsSavingQuestion(true);
    try {
      const payload = {
        subjectId: questionForm.subjectId,
        chapterId: questionForm.chapterId,
        type: questionForm.type,
        prompt: questionForm.prompt.trim(),
        options: questionForm.type === 'single_select' ? questionForm.options.map((o) => o.trim()) : [],
        correctAnswer: String(questionForm.correctAnswer).trim(),
        explanation: questionForm.explanation.trim(),
        difficulty: questionForm.difficulty,
        marks: parseInt(questionForm.marks) || 1,
        negativeMarks: parseFloat(questionForm.negativeMarks) || 0,
        reviewStatus: questionForm.reviewStatus
      };

      if (modalMode === 'edit' && questionForm.id) {
        await api.patch(`/admin/questions/${questionForm.id}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }

      setShowQuestionModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save question.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Insert math or format snippet into Prompt / Explanation
  const insertSnippet = (snippet, field = 'prompt') => {
    const ref = field === 'prompt' ? promptInputRef.current : explanationInputRef.current;
    const current = questionForm[field] || '';

    if (ref && typeof ref.selectionStart === 'number') {
      const start = ref.selectionStart;
      const end = ref.selectionEnd;
      const before = current.substring(0, start);
      const after = current.substring(end);
      const nextContent = before + snippet + after;
      setQuestionForm((prev) => ({ ...prev, [field]: nextContent }));
      setTimeout(() => {
        ref.focus();
        ref.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 50);
    } else {
      setQuestionForm((prev) => ({ ...prev, [field]: current ? `${current} ${snippet}` : snippet }));
    }
  };

  // Image Upload for Diagram / Question figure
  const handleImageUpload = async (e, field = 'prompt') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError('');
    try {
      const res = await api.upload(file);
      const caption = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const markdownImage = `\n\n![Fig: ${caption}](${res.url})\n\n`;
      insertSnippet(markdownImage, field);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Option Handlers for MCQ
  const handleOptionChange = (idx, value) => {
    const updated = [...questionForm.options];
    updated[idx] = value;
    setQuestionForm((prev) => ({ ...prev, options: updated }));
  };

  const handleAddOption = () => {
    if (questionForm.options.length >= 6) return;
    setQuestionForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOption = (idx) => {
    if (questionForm.options.length <= 2) return;
    const updated = questionForm.options.filter((_, i) => i !== idx);
    let nextCorrect = questionForm.correctAnswer;
    if (parseInt(nextCorrect) === idx) {
      nextCorrect = '0';
    } else if (parseInt(nextCorrect) > idx) {
      nextCorrect = String(parseInt(nextCorrect) - 1);
    }
    setQuestionForm((prev) => ({ ...prev, options: updated, correctAnswer: nextCorrect }));
  };

  // =========================================================================
  // BULK UPLOAD HANDLERS (CSV & JSON)
  // =========================================================================
  const handleDownloadSampleCsv = () => {
    const subName = subjects[0]?.name || 'Mathematics';
    const csvContent = `Subject,Chapter,Type,Prompt,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation,Difficulty,Marks
"${subName}","Rational Numbers","single_select","What is the multiplicative inverse (reciprocal) of -5/8 * (-3/7)?","15/56","56/15","-56/15","1","1","First evaluate product: 15/56. Its reciprocal is 56/15.","medium",2
"${subName}","Rational Numbers","single_select","Which rational number has no reciprocal?","0","1","-1","None of these","0","The number 0 has no reciprocal because 1/0 is undefined.","easy",1
"${subName}","Linear Equations","numerical","Solve for x: 3x - 5 = 16","","","","","7","3x = 16 + 5 => 3x = 21 => x = 7","easy",2
"${subName}","Rational Numbers","true_false","Every integer is a rational number.","True","False","","","0","An integer n can always be written as n/1.","easy",1`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'class8_question_bank_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least 1 question row.');

    // Simple CSV parser supporting quotes
    const parseLine = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseLine(line);
      if (cols.length < 4) continue;

      const subName = cols[0] || '';
      const chapName = cols[1] || '';
      const type = (cols[2] || 'single_select').toLowerCase().trim();
      const prompt = cols[3] || '';
      const optA = cols[4] || '';
      const optB = cols[5] || '';
      const optC = cols[6] || '';
      const optD = cols[7] || '';
      const correct = cols[8] || '0';
      const explanation = cols[9] || '';
      const difficulty = (cols[10] || 'medium').toLowerCase();
      const marks = parseInt(cols[11]) || 1;

      // Find matching subject
      const matchedSub = subjects.find(
        (s) => s.name.toLowerCase() === subName.toLowerCase()
      ) || subjects[0];

      // Find matching chapter or fallback
      const matchedChap = chapters.find(
        (c) => c.title.toLowerCase().includes(chapName.toLowerCase())
      ) || chapters[0];

      const options = [];
      if (type === 'single_select') {
        if (optA) options.push(optA);
        if (optB) options.push(optB);
        if (optC) options.push(optC);
        if (optD) options.push(optD);
      } else if (type === 'true_false') {
        options.push('True', 'False');
      }

      parsed.push({
        subjectId: matchedSub?.id || subjects[0]?.id || '',
        subjectName: matchedSub?.name || 'Subject',
        chapterId: matchedChap?.id || '',
        chapterTitle: matchedChap?.title || chapName || 'Chapter',
        type,
        prompt,
        options,
        correctAnswer: String(correct),
        explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        marks,
        reviewStatus: 'approved'
      });
    }

    if (parsed.length === 0) throw new Error('No valid questions found in CSV.');
    return parsed;
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setBulkText(text);
        const parsed = parseCsvText(text);
        setParsedBulkQuestions(parsed);
      } catch (err) {
        setBulkError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleParseJson = () => {
    setBulkError('');
    try {
      const data = JSON.parse(bulkText);
      const arr = Array.isArray(data) ? data : data.questions;
      if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error('JSON must contain an array of question objects.');
      }

      const parsed = arr.map((q, idx) => ({
        subjectId: q.subjectId || subjects[0]?.id || '',
        chapterId: q.chapterId || '',
        type: q.type || 'single_select',
        prompt: q.prompt || `Question #${idx + 1}`,
        options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
        correctAnswer: String(q.correctAnswer ?? '0'),
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 1,
        reviewStatus: 'approved'
      }));

      setParsedBulkQuestions(parsed);
    } catch (err) {
      setBulkError(err.message || 'Invalid JSON format.');
    }
  };

  const handleCommitBulkImport = async () => {
    if (parsedBulkQuestions.length === 0) return;
    setIsImporting(true);
    setBulkError('');
    try {
      await api.post('/admin/questions/bulk-import', {
        questions: parsedBulkQuestions
      });

      setImportSuccessMsg(`Successfully imported ${parsedBulkQuestions.length} questions into Question Bank!`);
      setParsedBulkQuestions([]);
      setBulkText('');
      setTimeout(() => {
        setImportSuccessMsg('');
        setShowBulkModal(false);
      }, 2000);
      await loadData();
    } catch (err) {
      setBulkError(err.message || 'Failed to import questions.');
    } finally {
      setIsImporting(false);
    }
  };

  // Stats Counters
  const stats = useMemo(() => {
    return {
      total: questions.length,
      approved: questions.filter((q) => q.reviewStatus === 'approved').length,
      needsReview: questions.filter((q) => q.reviewStatus === 'needs_review').length,
      easy: questions.filter((q) => q.difficulty === 'easy').length,
      medium: questions.filter((q) => q.difficulty === 'medium').length,
      hard: questions.filter((q) => q.difficulty === 'hard').length
    };
  }, [questions]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER WITH CRUD ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20">
              Assessment Central
            </span>
            <span className="text-xs text-text-muted font-medium">Class 8 ICSE Curriculum</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
            Class 8 Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Create, edit, curate, and bulk-upload questions with KaTeX math & diagram support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setBulkError('');
              setParsedBulkQuestions([]);
              setBulkText('');
              setShowBulkModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-page hover:bg-surface text-text text-xs font-bold transition-all shadow-2xs hover:border-accent"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Upload (CSV / JSON)</span>
          </button>

          <Link
            to="/admin/ai-question-generator"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-accent-soft text-accent hover:bg-accent/20 text-xs font-bold transition-all border border-accent/30"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>AI Generator</span>
          </Link>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold hover:bg-accent-hover active:scale-95 transition-all shadow-sm shadow-accent/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS OVERVIEW CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-surface rounded-xl border border-border p-3.5 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Items</span>
          <span className="font-editorial text-xl font-black text-text">{stats.total}</span>
        </div>
        <div className="bg-surface rounded-xl border border-emerald-200/70 p-3.5 text-center bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Approved</span>
          <span className="font-editorial text-xl font-black text-emerald-700">{stats.approved}</span>
        </div>
        <div className="bg-surface rounded-xl border border-amber-200/70 p-3.5 text-center bg-amber-50/20">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Needs Review</span>
          <span className="font-editorial text-xl font-black text-amber-700">{stats.needsReview}</span>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3.5 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Easy (★)</span>
          <span className="font-editorial text-xl font-black text-text">{stats.easy}</span>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3.5 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Medium (★★)</span>
          <span className="font-editorial text-xl font-black text-text">{stats.medium}</span>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3.5 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Hard (★★★)</span>
          <span className="font-editorial text-xl font-black text-rose-600">{stats.hard}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH, FILTER & BULK CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompt text, terms, or formula..."
              className="w-full pl-10 pr-3.5 py-2.5 border border-border rounded-xl text-xs bg-page focus:bg-surface focus:outline-hidden focus:ring-2 focus:ring-accent font-medium text-text placeholder:text-text-muted"
            />
          </div>

          {/* Subject Filter */}
          <div className="md:col-span-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-xs bg-page text-text font-medium"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div className="md:col-span-2">
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              disabled={!filterSubject}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-xs bg-page text-text font-medium disabled:opacity-50"
            >
              <option value="">All Chapters</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="md:col-span-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-xs bg-page text-text font-medium"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-xs bg-page text-text font-medium"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="needs_review">Needs Review</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/80 text-xs">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-text-muted hover:text-text select-none">
              <input
                type="checkbox"
                checked={questions.length > 0 && selectedIds.length === questions.length}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-border text-accent accent-accent cursor-pointer"
              />
              <span>Select All on Page ({questions.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <span className="font-extrabold text-accent px-2 py-0.5 rounded-full bg-accent-soft text-[11px]">
                {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve All</span>
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-2xs flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Mark Review</span>
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-2xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          ) : (
            <div className="text-text-muted text-[11px] font-medium">
              Showing {questions.length} assessment items
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUESTIONS CARDS LIST */}
      {/* ========================================================================= */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border">
            <span className="text-xs font-bold text-text-muted">Loading question bank...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-3">
            <HelpCircle className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <p className="text-sm font-bold text-text">No questions found matching your filter.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold"
            >
              + Add First Question
            </button>
          </div>
        ) : (
          questions.map((q) => {
            const isSelected = selectedIds.includes(q.id);

            return (
              <div
                key={q.id}
                className={`bg-surface rounded-2xl border transition-all p-5 sm:p-6 space-y-4 shadow-2xs ${
                  isSelected ? 'border-accent ring-1 ring-accent/30 bg-accent-soft/10' : 'border-border hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(q.id)}
                      className="mt-1 h-4 w-4 rounded border-border text-accent accent-accent shrink-0 cursor-pointer"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-accent uppercase tracking-wider text-[11px]">
                          {q.subjectName} • {q.chapterTitle}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {q.difficulty || 'Medium'} • {(q.type || 'single_select').replace('_', ' ')} • {q.marks ?? 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(q)}
                          title="Click to toggle status"
                          className="cursor-pointer transition-transform active:scale-95"
                        >
                          <StatusBadge status={q.reviewStatus} />
                        </button>

                        {q.sourceType === 'ai' && (
                          <span className="text-[10px] text-purple-700 font-extrabold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                            AI Sourced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="p-1.5 rounded-lg border border-border text-slate-600 hover:text-accent hover:border-accent hover:bg-accent-soft transition-colors"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCloneQuestion(q)}
                      className="p-1.5 rounded-lg border border-border text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      title="Clone / Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg border border-border text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="text-sm sm:text-base font-semibold text-text leading-relaxed pl-7">
                  <MathRenderer content={q.prompt} />
                </div>

                {/* MCQ Options Display */}
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = String(q.correctAnswer) === String(oIdx);
                      const letter = String.fromCharCode(65 + oIdx);

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                              : 'bg-page/60 border-border text-text'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="truncate">
                              <MathRenderer content={opt} />
                            </span>
                          </div>

                          {isCorrect && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shrink-0 uppercase tracking-wider">
                              Correct Ans
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Non-MCQ Answer Display */}
                {q.type !== 'single_select' && q.correctAnswer && (
                  <div className="pl-7 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Correct Answer: {q.correctAnswer}</span>
                    </span>
                  </div>
                )}

                {/* Worked Solution / Explanation */}
                {q.explanation && (
                  <div className="pl-7">
                    <div className="p-3.5 rounded-xl bg-orange-50/70 border-l-4 border-orange-500 text-xs sm:text-sm text-text leading-relaxed">
                      <span className="font-extrabold text-orange-900 block text-[10px] uppercase tracking-wider mb-1">
                        Worked Solution / Explanation:
                      </span>
                      <MathRenderer content={q.explanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT QUESTION */}
      {/* ========================================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveQuestion}
            className="bg-surface rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 animate-in fade-in duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <h3 className="font-editorial text-xl font-bold text-text">
                  {modalMode === 'edit' ? 'Edit Question Item' : 'Add New Question to Bank'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  LaTeX formulas and diagram uploads are supported.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject & Chapter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={questionForm.subjectId}
                  onChange={(e) => setQuestionForm({ ...questionForm, subjectId: e.target.value, chapterId: '' })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Chapter <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={questionForm.chapterId}
                  onChange={(e) => setQuestionForm({ ...questionForm, chapterId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold"
                >
                  <option value="">-- Choose Chapter --</option>
                  {modalChapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type, Difficulty, Marks Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">Type</label>
                <select
                  value={questionForm.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let defCorrect = '0';
                    let defOpts = ['', '', '', ''];
                    if (newType === 'true_false') {
                      defOpts = ['True', 'False'];
                    }
                    setQuestionForm({ ...questionForm, type: newType, options: defOpts, correctAnswer: defCorrect });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  <option value="single_select">Multiple Choice (MCQ)</option>
                  <option value="numerical">Numerical Value</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">Difficulty</label>
                <select
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  <option value="easy">Easy (★)</option>
                  <option value="medium">Medium (★★)</option>
                  <option value="hard">Hard (★★★)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">Marks</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={questionForm.reviewStatus}
                  onChange={(e) => setQuestionForm({ ...questionForm, reviewStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  <option value="approved">Approved</option>
                  <option value="needs_review">Needs Review</option>
                </select>
              </div>
            </div>

            {/* Prompt Editor & Quick Formula Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-text uppercase tracking-wider">
                  Question Prompt <span className="text-rose-500">*</span>
                </label>

                {/* Quick Formula Helper Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertSnippet('$$ E = mc^2 $$', 'prompt')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                  >
                    + Formula ($$)
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('\\( \\frac{a}{b} \\)', 'prompt')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                  >
                    + Fraction
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('**bold**', 'prompt')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold font-mono"
                  >
                    **bold**
                  </button>

                  {/* Diagram Upload Button for Prompt */}
                  <label className="px-2.5 py-0.5 rounded bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1 transition-colors">
                    <Image className="w-3 h-3" />
                    <span>{uploadingImage ? 'Uploading...' : '+ Diagram'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => handleImageUpload(e, 'prompt')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              <textarea
                ref={promptInputRef}
                rows={3}
                required
                value={questionForm.prompt}
                onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                placeholder="e.g. What is the multiplicative inverse of \( \frac{-5}{8} \times \frac{-3}{7} \)?"
                className="w-full p-3.5 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium leading-relaxed focus:ring-2 focus:ring-accent outline-none"
              />

              {/* Live KaTeX Preview of Prompt */}
              {questionForm.prompt && (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Live Prompt Preview:
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800">
                    <MathRenderer content={questionForm.prompt} />
                  </div>
                </div>
              )}
            </div>

            {/* Options Editor (MCQ) */}
            {questionForm.type === 'single_select' && (
              <div className="space-y-3 p-4 rounded-2xl bg-page border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-text uppercase tracking-wider block">
                      Options & Correct Answer
                    </span>
                    <span className="text-[11px] text-text-muted">
                      Select the radio button next to the correct choice.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    disabled={questionForm.options.length >= 6}
                    className="px-2.5 py-1 rounded-lg bg-accent-soft text-accent text-xs font-bold hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2.5">
                  {questionForm.options.map((opt, oIdx) => {
                    const isSelectedCorrect = String(questionForm.correctAnswer) === String(oIdx);
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                          isSelectedCorrect ? 'bg-emerald-50/80 border-emerald-300' : 'bg-surface border-border'
                        }`}
                      >
                        {/* Radio Button for Correct Choice */}
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="correctAnswerRadio"
                            checked={isSelectedCorrect}
                            onChange={() => setQuestionForm({ ...questionForm, correctAnswer: String(oIdx) })}
                            className="h-4 w-4 accent-emerald-600 cursor-pointer"
                          />
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelectedCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                        </label>

                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                          placeholder={`Option ${letter} text or formula (e.g. \\frac{56}{15})`}
                          className="flex-1 px-3 py-1.5 border border-border rounded-lg text-xs sm:text-sm bg-surface text-text font-medium"
                        />

                        {questionForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(oIdx)}
                            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* True / False Option Selection */}
            {questionForm.type === 'true_false' && (
              <div className="p-4 rounded-2xl bg-page border border-border space-y-2">
                <span className="text-xs font-extrabold text-text uppercase tracking-wider block">
                  Select Correct Answer:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {['0', '1'].map((val) => {
                    const label = val === '0' ? 'True' : 'False';
                    const isSelected = String(questionForm.correctAnswer) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuestionForm({ ...questionForm, correctAnswer: val })}
                        className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-surface text-text border-border hover:bg-page'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Numerical Answer Input */}
            {questionForm.type === 'numerical' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-text uppercase tracking-wider">
                  Exact Numerical Answer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  placeholder="e.g. 7 or -3.5"
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-bold font-mono"
                />
              </div>
            )}

            {/* Worked Solution / Explanation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-text uppercase tracking-wider">
                  Worked Solution / Explanation
                </label>

                {/* Image Upload for Solution */}
                <label className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors">
                  <Image className="w-3 h-3 text-slate-500" />
                  <span>+ Diagram</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => handleImageUpload(e, 'explanation')}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                ref={explanationInputRef}
                rows={3}
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Step 1: Simplify fraction... Step 2: Invert numerator and denominator..."
                className="w-full p-3.5 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium leading-relaxed focus:ring-2 focus:ring-accent outline-none"
              />

              {/* Solution Preview */}
              {questionForm.explanation && (
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 block mb-1">
                    Solution Preview:
                  </span>
                  <div className="text-xs font-medium text-slate-800">
                    <MathRenderer content={questionForm.explanation} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-text font-bold text-xs hover:bg-page transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingQuestion}
                className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-extrabold shadow-sm shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingQuestion ? 'Saving Question...' : modalMode === 'edit' ? 'Update Question' : 'Save to Question Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK UPLOAD (CSV & JSON) */}
      {/* ========================================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-text">
                    Bulk Upload Questions
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Import multiple questions at once using CSV spreadsheet or JSON.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-page transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setBulkTab('csv')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bulkTab === 'csv'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-page text-text-muted hover:text-text'
                }`}
              >
                CSV File / Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('json')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bulkTab === 'json'
                    ? 'bg-accent text-white shadow-2xs'
                    : 'bg-page text-text-muted hover:text-text'
                }`}
              >
                JSON Array
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="ml-auto px-3 py-1 rounded-lg border border-border text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {bulkError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {bulkError}
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {importSuccessMsg}
              </div>
            )}

            {/* CSV TAB */}
            {bulkTab === 'csv' && (
              <div className="space-y-4">
                {/* File Dropzone */}
                <label className="border-2 border-dashed border-border hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <UploadCloud className="w-8 h-8 text-text-muted group-hover:text-emerald-600 mb-2 transition-colors" />
                  <span className="text-xs font-bold text-text group-hover:text-emerald-700 text-center">
                    Click to select CSV File (from Excel or Google Sheets)
                  </span>
                  <span className="text-[11px] text-text-muted mt-0.5">
                    Columns: Subject, Chapter, Type, Prompt, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation, Difficulty, Marks
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Or paste CSV text */}
                <div>
                  <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">
                    Or Paste CSV Content:
                  </label>
                  <textarea
                    rows={4}
                    value={bulkText}
                    onChange={(e) => {
                      setBulkText(e.target.value);
                      try {
                        const parsed = parseCsvText(e.target.value);
                        setParsedBulkQuestions(parsed);
                        setBulkError('');
                      } catch (err) {
                        // ignore typing errors
                      }
                    }}
                    placeholder='Subject,Chapter,Type,Prompt,OptionA,OptionB,OptionC,OptionD,CorrectAnswer...'
                    className="w-full p-3 border border-border rounded-xl text-xs bg-page font-mono"
                  />
                </div>
              </div>
            )}

            {/* JSON TAB */}
            {bulkTab === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text uppercase tracking-wider">
                    Paste JSON Questions Array:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = [
                        {
                          prompt: "What is the square of 25?",
                          type: "single_select",
                          options: ["50", "125", "625", "250"],
                          correctAnswer: "2",
                          difficulty: "easy",
                          marks: 1
                        }
                      ];
                      setBulkText(JSON.stringify(sample, null, 2));
                    }}
                    className="text-xs text-accent font-bold hover:underline"
                  >
                    Load Sample JSON
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder='[\n  {\n    "prompt": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": "0"\n  }\n]'
                  className="w-full p-3 border border-border rounded-xl text-xs bg-page font-mono"
                />

                <button
                  type="button"
                  onClick={handleParseJson}
                  className="px-3.5 py-1.5 rounded-lg bg-page border border-border text-xs font-bold text-text hover:bg-surface"
                >
                  Validate JSON
                </button>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedBulkQuestions.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Ready to import {parsedBulkQuestions.length} valid questions</span>
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-page">
                  {parsedBulkQuestions.map((pq, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex items-center justify-between gap-3">
                      <span className="font-bold text-text-muted shrink-0">#{idx + 1}</span>
                      <span className="font-medium text-text truncate flex-1">{pq.prompt}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-text-muted shrink-0 capitalize">
                        {(pq.type || 'single_select').replace('_', ' ')} • {pq.difficulty || 'Medium'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-text font-bold text-xs hover:bg-page transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={parsedBulkQuestions.length === 0 || isImporting}
                onClick={handleCommitBulkImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isImporting ? 'Importing Questions...' : `Import ${parsedBulkQuestions.length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
