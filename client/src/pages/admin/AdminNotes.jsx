import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle,
  Save,
  Trash2,
  Smartphone,
  X,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  FolderTree,
  Send,
  HelpCircle,
  Split,
  Maximize2,
  RotateCcw,
  Check,
  Image,
  UploadCloud,
  Table
} from 'lucide-react';

const ICSE_STARTER_TEMPLATE = `# 1. Introduction & Core Concept
Every concept begins with a simple real-world observation. In this chapter, we explore key definitions and logical steps.

## Key Definitions & Terminology
- **Primary Definition**: A clear statement of what this topic means.
- **Key Property 1**: The fundamental rule that applies in all cases.
- **Key Property 2**: Another essential observation to remember.

## Important Mathematical Formulas
Here are the core formulas for this topic:

$$ E = mc^2 $$

Or for linear arithmetic:

$$ y = mx + c $$

> 💡 Exam Tip: In board exams, always write the formula first before substituting numbers. This guarantees method marks!

Example: A practical numerical problem
Q: Find the value of x when 2x + 5 = 15.
Step 1: Subtract 5 from both sides -> 2x = 10
Step 2: Divide both sides by 2 -> x = 5
Answer: x = 5

## Summary & Quick Revision
- Always verify your final answer by substituting back into the equation.
- Keep units consistent throughout your calculations.`;

export function AdminNotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Active editing state: null = list view, object = editor view
  const [editingNote, setEditingNote] = useState(null);
  const textareaRef = useRef(null);
  const [previewNote, setPreviewNote] = useState(null); // for modal preview
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'edit-only' | 'preview-only'
  const [isPhonePreview, setIsPhonePreview] = useState(false);

  // Image & Diagram Insertion Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filters for list view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 1. Initial Data Fetch
  const loadData = async () => {
    try {
      const [nRes, sRes] = await Promise.all([
        api.get('/notes'),
        api.get('/subjects')
      ]);
      setNotes(nRes.notes || []);
      setSubjects(sRes.subjects || []);
    } catch (e) {
      console.error('Failed to load notes data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Handle URL parameters (e.g. ?subjectId=...&chapterId=...&action=new)
  useEffect(() => {
    const action = searchParams.get('action');
    const paramSubId = searchParams.get('subjectId');
    const paramChapId = searchParams.get('chapterId');

    if (action === 'new' && subjects.length > 0) {
      const subId = paramSubId || subjects[0]?.id || '';
      startNewNote(subId, paramChapId || '');
    }
  }, [searchParams, subjects]);

  // 3. When editingNote's subject changes, load its chapters
  useEffect(() => {
    async function fetchChaptersForSubject() {
      if (!editingNote?.subjectId) {
        setChapters([]);
        return;
      }
      try {
        const res = await api.get(`/subjects/${editingNote.subjectId}/chapters`);
        const chaps = res.chapters || [];
        setChapters(chaps);
        // If current chapterId is not valid for this subject, default to first or keep empty
        if (!chaps.some((c) => c.id === editingNote.chapterId)) {
          setEditingNote((prev) => (prev ? { ...prev, chapterId: chaps[0]?.id || '' } : null));
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchChaptersForSubject();
  }, [editingNote?.subjectId]);

  const startNewNote = (subId = '', chapId = '') => {
    const defaultSub = subId || subjects[0]?.id || '';
    setEditingNote({
      id: null,
      title: '',
      subjectId: defaultSub,
      chapterId: chapId || '',
      summary: '',
      contentHtml: '',
      readTimeMinutes: 5,
      tags: [],
      status: 'draft'
    });
  };

  const handleEditNote = (note) => {
    setEditingNote({
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : []
    });
  };

  const handleInsertSnippet = (snippet) => {
    if (!editingNote) return;
    const textarea = textareaRef.current;
    const current = editingNote.contentHtml || '';

    if (textarea && typeof textarea.selectionStart === 'number') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = current.substring(0, start);
      const after = current.substring(end);
      const prefix = before.length > 0 && !before.endsWith('\n') ? '\n\n' : '';
      const suffix = after.length > 0 && !after.startsWith('\n') ? '\n\n' : '';
      const newContent = before + prefix + snippet + suffix + after;
      setEditingNote({ ...editingNote, contentHtml: newContent });
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + prefix.length + snippet.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 50);
    } else {
      const newContent = current ? current + '\n\n' + snippet : snippet;
      setEditingNote({ ...editingNote, contentHtml: newContent });
    }
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError('');
    try {
      const res = await api.upload(file);
      setImageUrl(res.url);
      if (!imageCaption) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setImageCaption(`Fig: ${cleanName}`);
      }
    } catch (err) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleInsertImage = (urlToInsert, captionToInsert) => {
    const finalUrl = (urlToInsert || imageUrl || '').trim();
    if (!finalUrl) {
      alert('Please upload an image or provide an image URL.');
      return;
    }
    const finalCaption = (captionToInsert || imageCaption || 'Curriculum Diagram').trim();
    const snippet = `![${finalCaption}](${finalUrl})`;
    handleInsertSnippet(snippet);
    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
    setUploadError('');
  };

  const handleSaveNote = async (publishNow = false) => {
    if (!editingNote.title.trim()) {
      alert('Please enter a Note Title.');
      return;
    }
    if (!editingNote.subjectId) {
      alert('Please select a Subject.');
      return;
    }
    if (!editingNote.chapterId) {
      alert('Please select a Chapter. (If no chapters exist, create one first in Syllabus & Chapters).');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const payload = {
        ...editingNote,
        status: publishNow ? 'published' : editingNote.status
      };

      if (editingNote.id) {
        await api.patch(`/admin/notes/${editingNote.id}`, payload);
      } else {
        await api.post('/admin/notes', payload);
      }

      await loadData();
      setSaveSuccessMsg(publishNow ? 'Note published successfully!' : 'Draft saved!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      setEditingNote(null);
      // Clean query params
      setSearchParams({});
    } catch (err) {
      alert(err.message || 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this study note?')) return;
    try {
      await api.delete(`/admin/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
      if (previewNote?.id === id) setPreviewNote(null);
    } catch (err) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  const handleTogglePublish = async (note) => {
    const nextStatus = note.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.patch(`/admin/notes/${note.id}`, { status: nextStatus });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: res.note.status } : n))
      );
    } catch (e) {
      alert('Failed to update status');
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        searchQuery === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.chapterTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSubject =
        selectedSubjectFilter === 'all' || n.subjectId === selectedSubjectFilter;

      const matchStatus =
        selectedStatusFilter === 'all' || n.status === selectedStatusFilter;

      return matchSearch && matchSubject && matchStatus;
    });
  }, [notes, searchQuery, selectedSubjectFilter, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading curriculum notes...</p>
      </div>
    );
  }

    const renderImageModal = () => {
    if (!showImageModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 relative animate-in fade-in zoom-in duration-150">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-extrabold text-slate-900">
                  Insert Diagram or Image
                </h3>
                <p className="text-xs text-slate-500">
                  Add visual geometry, graph plots, or ICSE figures to your note
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {uploadError}
            </div>
          )}

          {/* Option A: Upload from Device */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Option 1: Upload from Computer / Phone
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-sky-700 text-center">
                {isUploadingImage ? 'Uploading image via Cloudinary...' : 'Click to choose image file (PNG, JPG, SVG)'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">Supports diagrams, screenshots & textbook photos</span>
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingImage}
                onChange={handleImageFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Option B: Direct URL Input */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Or Image / Diagram Web URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/graph-diagram.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Figure Caption / Title (e.g. Fig 1.1)
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="e.g. Fig 1.1: Vertex adjacency graph representation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Image Preview if URL exists */}
          {imageUrl && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Diagram Preview
              </span>
              <img
                src={imageUrl}
                alt={imageCaption || 'Preview'}
                className="max-h-36 mx-auto rounded-lg object-contain"
              />
            </div>
          )}

          {/* Quick Preset Diagrams */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 block">Or pick a starter diagram preset:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleInsertImage(
                    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
                    'Fig 1.1: Network Nodes & Edges Graph Model'
                  )
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800 block">Network Graph</span>
                <span className="text-[10px] text-slate-500">Nodes, vertices & links</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleInsertImage(
                    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
                    'Fig 1.2: 2D Coordinate Grid Plane'
                  )
                }
                className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800 block">Coordinate Grid</span>
                <span className="text-[10px] text-slate-500">X & Y axes plotting</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleInsertImage()}
              disabled={!imageUrl || isUploadingImage}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all"
            >
              Insert Diagram into Note
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 1: NOTE EDITOR (VISUAL & MARKDOWN, NO HTML CODE REQUIRED)
  // =========================================================================
  if (editingNote) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-150">
        {/* Editor Top Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
              <span className="uppercase tracking-wider">
                {editingNote.id ? 'Edit Study Note' : 'Create Study Note'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">No HTML Code Needed</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {editingNote.title || 'Untitled Note'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* View Mode Switches */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split Editor & Live Student Preview"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit-only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  viewMode === 'edit-only' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Editor Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview-only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'preview-only' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Only</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPhonePreview(!isPhonePreview)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isPhonePreview
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle mobile phone reading width"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Phone Frame</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingNote(null);
                setSearchParams({});
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSaveNote(false)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveNote(true)}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Publishing...' : 'Publish Note 🚀'}</span>
            </button>
          </div>
        </div>

        {/* Note Metadata Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Title */}
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Note Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                placeholder="e.g. Graphs and Algorithms — Foundations & Core Principles"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm sm:text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Subject */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={editingNote.subjectId}
                onChange={(e) => setEditingNote({ ...editingNote, subjectId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chapter <span className="text-rose-500">*</span>
              </label>
              <select
                value={editingNote.chapterId}
                onChange={(e) => setEditingNote({ ...editingNote, chapterId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="">-- Choose Chapter --</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Summary */}
            <div className="md:col-span-9">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Short Summary (Shown on student dashboard cards)
              </label>
              <input
                type="text"
                value={editingNote.summary}
                onChange={(e) => setEditingNote({ ...editingNote, summary: e.target.value })}
                placeholder="1-2 sentences capturing core takeaway for quick reading..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Reading Time */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Est. Read Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={editingNote.readTimeMinutes}
                onChange={(e) =>
                  setEditingNote({
                    ...editingNote,
                    readTimeMinutes: parseInt(e.target.value) || 5
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COMPOSER WORKSPACE: Left (Formatting & Input) | Right (Live Student View) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Left Column: Composer */}
          {(viewMode === 'split' || viewMode === 'edit-only') && (
            <div
              className={`${
                viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
              } bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5`}
            >
              {/* Quick Formatting Toolbar */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Quick Format Tools (Tap to insert — No HTML needed)</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleInsertSnippet(ICSE_STARTER_TEMPLATE)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors"
                  >
                    + Load Starter Guide
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Upload Diagram / Image Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadError('');
                      setShowImageModal(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>+ 📷 Add Diagram / Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleInsertSnippet(
                        '| Concept / Term | Property A | Property B |\n| --- | --- | --- |\n| Rule 1 | True / Applicable | Requires Condition |\n| Rule 2 | Always Valid | Exception at 0 |'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Table className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Table</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('# Topic Title')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    + Main Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('## Key Concept')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    + Subheading
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('- Key point 1\n- Key point 2\n- Key point 3')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    + Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('$$ a^2 + b^2 = c^2 $$')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors"
                  >
                    + Math Equation ($$)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertSnippet(
                        '> 💡 Exam Tip: Remember to write the unit of measurement in your final answer.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition-colors"
                  >
                    + Exam Tip Card
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertSnippet(
                        'Example: Solve for x when 3x = 12.\nStep 1: Divide both sides by 3.\nAnswer: x = 4'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
                  >
                    + Solved Example
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('**bold word**')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors font-mono"
                  >
                    **bold**
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  ref={textareaRef}
                  rows={20}
                  value={editingNote.contentHtml}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, contentHtml: e.target.value })
                  }
                  placeholder={`Write your note naturally here...\n\n# 1. First Section\nWrite normal paragraphs simply by pressing Enter twice.\n\n- Use hyphens for bullet points\n- Use **word** for bold text\n- Use $$ x = 5 $$ for mathematical formulas\n- Start a line with > for an exam tip callout`}
                  className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-sans focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none leading-relaxed transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Markdown & KaTeX supported</span>
                <span>{editingNote.contentHtml?.length || 0} characters</span>
              </div>
            </div>
          )}

          {/* Right Column: Live Student Reader Preview */}
          {(viewMode === 'split' || viewMode === 'preview-only') && (
            <div
              className={`${
                viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
              } ${isPhonePreview ? 'max-w-md mx-auto w-full' : ''}`}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                {/* Preview Header */}
                <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Live Student Reader Preview
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isPhonePreview ? 'Phone View (375px)' : 'Tablet / Desktop'}
                  </span>
                </div>

                {/* Simulated Student View */}
                <div className="p-6 sm:p-8 space-y-5 bg-[#F8F9FA] max-h-[78vh] overflow-y-auto">
                  {/* Subject & Time Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {subjects.find((s) => s.id === editingNote.subjectId)?.name || 'Subject'} ·{' '}
                      {chapters.find((c) => c.id === editingNote.chapterId)?.title || 'Chapter'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      {editingNote.readTimeMinutes} min read
                    </span>
                  </div>

                  {/* Note Title */}
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    {editingNote.title || 'Untitled Note'}
                  </h2>

                  {/* Summary Callout */}
                  {editingNote.summary && (
                    <div className="p-4 rounded-xl bg-orange-50/70 border-l-4 border-orange-500 text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                      {editingNote.summary}
                    </div>
                  )}

                  {/* Parsed Note Body */}
                  <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
                    {editingNote.contentHtml ? (
                      <MathRenderer content={editingNote.contentHtml} />
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium italic">
                        Start typing on the left or tap "+ Load Starter Guide" to see live formatted content here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {renderImageModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NOTES MANAGEMENT & CRUD LIST VIEW
  // =========================================================================
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Curriculum Content Desk
            </span>
            <span className="text-xs text-slate-400 font-medium">Class 8 ICSE</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notes Management & Publishing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author and publish notes with KaTeX equations, exam tips, and live student reader previews.
          </p>
        </div>

        <button
          onClick={() => startNewNote()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Write New Note</span>
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Search & Subject Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, topic, or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            {['all', 'published', 'draft'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  selectedStatusFilter === st
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 shrink-0">Subject:</span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedSubjectFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Subjects ({notes.length})
          </button>
          {subjects.map((sub) => {
            const count = notes.filter((n) => n.subjectId === sub.id).length;
            const isSelected = selectedSubjectFilter === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectFilter(sub.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {sub.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes List Cards */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3 shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-slate-800">
                No matching study notes found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {notes.length === 0
                  ? 'Start by creating your first chapter study note. No HTML coding is required!'
                  : 'Try adjusting your search query or subject filters.'}
              </p>
            </div>
            <button
              onClick={() => startNewNote()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm shadow-orange-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Write First Note</span>
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              {/* Note Details */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                    {note.subjectName} · {note.chapterTitle}
                  </span>
                  <StatusBadge status={note.status} />
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    {note.readTimeMinutes} min read
                  </span>
                </div>

                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-orange-600 transition-colors">
                  {note.title}
                </h3>

                {note.summary && (
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {note.summary}
                  </p>
                )}

                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
                  <span>
                    Updated: {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </span>
                  {note.publishedAt && (
                    <span className="text-emerald-600 font-semibold">
                      Published {new Date(note.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewNote(note)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                  title="View full note preview"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Preview</span>
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleEditNote(note)}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors"
                >
                  Edit Note
                </button>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePublish(note)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    note.status === 'published'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  title={note.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                >
                  {note.status === 'published' ? 'Published' : 'Draft'}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN STUDENT READER PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  {previewNote.subjectName} · {previewNote.chapterTitle}
                </span>
                <StatusBadge status={previewNote.status} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleEditNote(previewNote);
                    setPreviewNote(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-bold text-xs hover:bg-orange-100 transition-colors"
                >
                  Edit Note
                </button>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 bg-[#F8F9FA]">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{previewNote.readTimeMinutes} min read</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {previewNote.title}
              </h2>

              {previewNote.summary && (
                <div className="p-4 rounded-xl bg-orange-50/80 border-l-4 border-orange-500 text-slate-800 text-sm leading-relaxed font-medium">
                  {previewNote.summary}
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <MathRenderer content={previewNote.contentHtml} />
              </div>
            </div>
          </div>
        </div>
      )}
      {renderImageModal()}
    </div>
  );
}