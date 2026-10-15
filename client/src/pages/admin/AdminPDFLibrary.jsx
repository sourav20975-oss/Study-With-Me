import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api, resolveAssetUrl } from '../../api/client.js';
import {
  FileText,
  UploadCloud,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ExternalLink,
  Save,
  Check,
  Maximize2,
  FileCheck,
  HardDrive
} from 'lucide-react';

const CATEGORIES = [
  'Curriculum Textbook',
  'Revision Guide',
  'Formula Sheet',
  'Sample Paper',
  'Worksheet'
];

const SUBJECT_COLORS = {
  'Mathematics': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    border: 'border-orange-500',
    accent: 'text-orange-600',
    bg: 'bg-orange-50/50'
  },
  'Science': {
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    border: 'border-teal-500',
    accent: 'text-teal-600',
    bg: 'bg-teal-50/50'
  },
  'English': {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    border: 'border-amber-500',
    accent: 'text-amber-600',
    bg: 'bg-amber-50/50'
  },
  'Social Science': {
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    border: 'border-sky-500',
    accent: 'text-sky-600',
    bg: 'bg-sky-50/50'
  }
};

export function AdminPDFLibrary() {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload & Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null); // null = new, id = edit
  const fileInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    chapterId: '',
    category: 'Curriculum Textbook',
    pageCount: '',
    isPublished: true,
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    fileSizeFormatted: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // PDF Preview Reader Modal State
  const [readingDoc, setReadingDoc] = useState(null);

  // 1. Initial Data Fetch
  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, subsRes] = await Promise.all([
        api.get('/documents'),
        api.get('/subjects')
      ]);
      setDocuments(docsRes.documents || []);
      setSubjects(subsRes.subjects || []);
    } catch (e) {
      console.error('Failed to load PDF library data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch chapters when form subject changes
  useEffect(() => {
    async function loadChaptersForSubject() {
      if (!formData.subjectId) {
        setChapters([]);
        return;
      }
      try {
        const res = await api.get(`/subjects/${formData.subjectId}/chapters`);
        setChapters(res.chapters || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadChaptersForSubject();
  }, [formData.subjectId]);

  // Handle open modal for new PDF
  const handleOpenCreateModal = () => {
    setEditingDocId(null);
    setFormData({
      title: '',
      description: '',
      subjectId: subjects[0]?.id || '',
      chapterId: '',
      category: 'Curriculum Textbook',
      pageCount: '',
      isPublished: true,
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      fileSizeFormatted: ''
    });
    setSelectedFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle open modal for editing existing PDF
  const handleOpenEditModal = (doc) => {
    setEditingDocId(doc.id);
    setFormData({
      title: doc.title || '',
      description: doc.description || '',
      subjectId: doc.subjectId || '',
      chapterId: doc.chapterId || '',
      category: doc.category || 'Curriculum Textbook',
      pageCount: doc.pageCount || '',
      isPublished: doc.isPublished !== false,
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || 0,
      fileSizeFormatted: doc.fileSizeFormatted || ''
    });
    setSelectedFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle file selection (max 100MB validation)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate 100MB limit
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFormError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 100 MB.`);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFormError('Only PDF documents are allowed.');
      return;
    }

    setFormError('');
    setSelectedFile(file);

    // Auto-fill title from filename if title is empty
    if (!formData.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormData((prev) => ({
        ...prev,
        title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      }));
    }
  };

  // Handle Save (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Please enter a document title.');
      return;
    }
    if (!formData.subjectId) {
      setFormError('Please select a subject.');
      return;
    }

    let finalFileUrl = formData.fileUrl;
    let finalFileName = formData.fileName;
    let finalFileSize = formData.fileSize;

    setIsUploading(true);

    try {
      // If new file chosen, upload it first
      if (selectedFile) {
        setUploadProgress(20);
        const uploadRes = await api.upload(selectedFile);
        finalFileUrl = uploadRes.url;
        finalFileName = uploadRes.originalName || selectedFile.name;
        finalFileSize = uploadRes.size || selectedFile.size;
        setUploadProgress(80);
      }

      if (!finalFileUrl) {
        setFormError('Please select a PDF file to upload.');
        setIsUploading(false);
        return;
      }

      const payload = {
        ...formData,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize
      };

      if (editingDocId) {
        // UPDATE (PUT)
        const res = await api.put(`/documents/${editingDocId}`, payload);
        setDocuments((prev) =>
          prev.map((d) => (d.id === editingDocId ? { ...d, ...res.document } : d))
        );
        showSuccess('PDF document details updated successfully!');
      } else {
        // CREATE (POST)
        const res = await api.post('/documents', payload);
        setDocuments((prev) => [res.document, ...prev]);
        showSuccess('New PDF document uploaded and published successfully!');
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save PDF document.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Delete (DELETE)
  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      showSuccess(`"${title}" was removed.`);
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  // Handle Download with counter increment
  const handleDownload = async (doc) => {
    try {
      api.post(`/documents/${doc.id}/download`).catch(() => {});
      // Trigger download
      const resolvedUrl = resolveAssetUrl(doc.fileUrl);
      const a = document.createElement('a');
      a.href = resolvedUrl;
      a.download = doc.fileName || `${doc.title}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Optimistically increment download count in state
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSubject =
        selectedSubjectFilter === 'all' || doc.subjectId === selectedSubjectFilter;
      const matchCategory =
        selectedCategoryFilter === 'all' ||
        doc.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchCategory && matchSearch;
    });
  }, [documents, selectedSubjectFilter, selectedCategoryFilter, searchQuery]);

  // Overall Statistics
  const totalDownloads = useMemo(() => {
    return documents.reduce((acc, d) => acc + (d.downloadCount || 0), 0);
  }, [documents]);

  const totalViews = useMemo(() => {
    return documents.reduce((acc, d) => acc + (d.viewCount || 0), 0);
  }, [documents]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[11px] uppercase tracking-wider border border-orange-200">
              Curriculum PDF Management
            </span>
            <span className="text-xs font-bold text-slate-400">Max 100 MB Uploads</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            Study Materials & PDF Library
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
            Upload and organize complete Class 8 ICSE Science textbooks, English grammar guides, Mathematics formula sheets, and past examination papers. Students can read online or download with 1 click.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New PDF Document</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{documents.length}</div>
            <div className="text-xs font-bold text-slate-400">Total PDF Documents</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{totalViews}</div>
            <div className="text-xs font-bold text-slate-400">Online Student Reads</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{totalDownloads}</div>
            <div className="text-xs font-bold text-slate-400">Total Downloads</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">100 MB</div>
            <div className="text-xs font-bold text-slate-400">Max File Size Limit</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedSubjectFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectFilter(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedSubjectFilter === sub.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Search input & category filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PDF Document Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading Study Materials & PDFs...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display text-base font-bold text-slate-800">No PDF Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedSubjectFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Get started by uploading your first Class 8 curriculum PDF textbook or formula sheet!'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors"
          >
            + Upload PDF (up to 100 MB)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const subStyle = SUBJECT_COLORS[doc.subjectName] || {
              badge: 'bg-slate-100 text-slate-800 border-slate-200',
              accent: 'text-slate-700'
            };

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${subStyle.badge}`}
                    >
                      {doc.subjectName}
                    </span>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {doc.category || 'Textbook'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-slate-500 text-xs font-medium mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5 truncate max-w-[170px]" title={doc.fileName}>
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{doc.fileName}</span>
                      </span>
                      <span className="text-slate-700 font-extrabold shrink-0">
                        {doc.fileSizeFormatted || 'PDF'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{doc.pageCount ? `${doc.pageCount} Pages` : 'Multi-Page'}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1" title="Online views">
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>{doc.viewCount || 0}</span>
                        </span>
                        <span className="flex items-center gap-1" title="Downloads">
                          <Download className="w-3 h-3 text-slate-400" />
                          <span>{doc.downloadCount || 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Read, Download, Edit, Delete) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Read / Preview */}
                    <button
                      type="button"
                      onClick={() => setReadingDoc(doc)}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 border border-orange-200 transition-colors"
                      title="Read PDF in viewer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>

                    {/* Download */}
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Download PDF file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete PDF"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE & EDIT PDF MODAL (Supports up to 100MB) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                  {editingDocId ? 'Edit Study Material' : 'Upload Study Material'}
                </span>
                <h2 className="font-display text-lg sm:text-xl font-black text-slate-900">
                  {editingDocId ? 'Edit PDF Details' : 'Upload Class 8 PDF (Max 100 MB)'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. ICSE Class 8 Science: Complete Chapter 3 Notes & Questions"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Subject & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select a Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter & Page Count Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chapter (Optional)
                  </label>
                  <select
                    value={formData.chapterId}
                    onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">General (No specific chapter)</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.pageCount}
                    onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                    placeholder="e.g. 18"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brief Summary / Topics Covered
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Elements vs Compounds, physical and chemical separation methods, worked exam problems."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 outline-none leading-relaxed"
                />
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PDF Document File {editingDocId ? '(Leave empty to keep current file)' : '<span className="text-rose-500">*</span>'}
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-orange-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf,.pdf"
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UploadCloud className={`w-8 h-8 ${selectedFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {selectedFile ? (
                      <div>
                        <span className="text-xs font-black text-emerald-800 block truncate max-w-sm">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          Ready to upload ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : formData.fileName ? (
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
                          Current File: {formData.fileName}
                        </span>
                        <span className="text-[11px] text-orange-600 font-semibold">
                          Click to choose a replacement PDF (Up to 100 MB)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
                          Click or drag and drop your PDF here
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Supports high-resolution textbooks and guides up to 100 MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Uploading PDF document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress || 50}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Publish Toggle */}
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="publishToggle"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="publishToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Publish immediately (Visible to Class 8 Students in their Library)
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : editingDocId ? 'Save Changes' : 'Upload & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL-SCREEN RESPONSIVE PDF VIEWER */}
      {/* ========================================================================= */}
      {readingDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          {/* Viewer Top Bar */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <h3 className="font-display text-sm sm:text-base font-black truncate">
                  {readingDoc.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="uppercase font-bold text-orange-400">{readingDoc.subjectName}</span>
                  <span>•</span>
                  <span>{readingDoc.fileName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownload(readingDoc)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <a
                href={resolveAssetUrl(readingDoc.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => setReadingDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="flex-1 w-full bg-slate-900 relative">
            <iframe
              src={`${resolveAssetUrl(readingDoc.fileUrl)}#toolbar=1&navpanes=0`}
              title={readingDoc.title}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
