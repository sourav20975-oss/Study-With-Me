import React, { useState, useEffect, useMemo } from 'react';
import { api, resolveAssetUrl } from '../../api/client.js';
import {
  FileText,
  Search,
  BookOpen,
  Download,
  Eye,
  Calendar,
  Sparkles,
  ExternalLink,
  X,
  Clock,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  ChevronRight,
  Calculator,
  FlaskConical,
  Globe,
  Share2
} from 'lucide-react';

const SUBJECT_CONFIG = {
  'Mathematics': {
    name: 'Mathematics',
    icon: Calculator,
    tab: 'Mathematics 📐',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    cardBorder: 'hover:border-orange-400',
    accentText: 'text-orange-600',
    btnBg: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20',
    subBg: 'bg-orange-50/50'
  },
  'Science': {
    name: 'Science',
    icon: FlaskConical,
    tab: 'Science 🔬',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    cardBorder: 'hover:border-teal-400',
    accentText: 'text-teal-600',
    btnBg: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20',
    subBg: 'bg-teal-50/50'
  },
  'English': {
    name: 'English',
    icon: BookOpen,
    tab: 'English 📖',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    cardBorder: 'hover:border-amber-400',
    accentText: 'text-amber-600',
    btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    subBg: 'bg-amber-50/50'
  },
  'Social Science': {
    name: 'Social Science',
    icon: Globe,
    tab: 'Social Science 🌍',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    cardBorder: 'hover:border-sky-400',
    accentText: 'text-sky-600',
    btnBg: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20',
    subBg: 'bg-sky-50/50'
  }
};

const CATEGORIES = [
  'Curriculum Textbook',
  'Revision Guide',
  'Formula Sheet',
  'Sample Paper',
  'Worksheet'
];

export function PDFLibraryView() {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeSubject, setActiveSubject] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader Modal State
  const [activeReadingDoc, setActiveReadingDoc] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadLibrary() {
      try {
        setLoading(true);
        const [docsRes, subsRes] = await Promise.all([
          api.get('/documents?role=student'),
          api.get('/subjects')
        ]);
        setDocuments(docsRes.documents || []);
        setSubjects(subsRes.subjects || []);
      } catch (err) {
        console.error('Failed to load PDF library:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSubject =
        activeSubject === 'all' ||
        doc.subjectId === activeSubject ||
        doc.subjectName?.toLowerCase() === activeSubject.toLowerCase();

      const matchCategory =
        activeCategory === 'all' ||
        doc.category?.toLowerCase() === activeCategory.toLowerCase();

      const matchSearch =
        !searchQuery.trim() ||
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSubject && matchCategory && matchSearch;
    });
  }, [documents, activeSubject, activeCategory, searchQuery]);

  // Handle Download with counter increment
  const handleDownload = async (doc) => {
    try {
      api.post(`/documents/${doc.id}/download`).catch(() => {});
      const resolvedUrl = resolveAssetUrl(doc.fileUrl);
      const a = document.createElement('a');
      a.href = resolvedUrl;
      a.download = doc.fileName || `${doc.title}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Optimistic download count increase
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = (doc) => {
    const fullUrl = resolveAssetUrl(doc.fileUrl);
    const shareable = fullUrl.startsWith('http') ? fullUrl : window.location.origin + fullUrl;
    navigator.clipboard?.writeText(shareable);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-150">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 p-6 sm:p-9 text-white shadow-fun">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Class 8 ICSE Study Materials</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
            PDF Textbooks, Guides & Formula Sheets
          </h1>

          <p className="text-orange-50 text-xs sm:text-sm font-medium leading-relaxed">
            Access and read complete official textbooks for Science, English, Mathematics, and Social Science online, or download them for offline revision.
          </p>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-[-40px] top-[-40px] w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 bottom-[-20px] w-36 h-36 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Subject Filter Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto scrollbar-none">
            <button
              onClick={() => setActiveSubject('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSubject === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects ({documents.length})
            </button>

            {subjects.map((sub) => {
              const cfg = SUBJECT_CONFIG[sub.name] || {};
              const count = documents.filter((d) => d.subjectId === sub.id).length;

              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubject(sub.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeSubject === sub.id
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cfg.tab || sub.name}</span>
                  <span className="text-[10px] opacity-80 font-black">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center gap-2 relative w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or topics..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
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
        </div>

        {/* Category Pills & Mobile Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Type:
            </span>
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              All Types
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="md:hidden relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, chapters..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* PDF Materials Cards Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading ICSE Study Library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-14 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display text-base font-bold text-slate-800">No PDFs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || activeSubject !== 'all'
              ? 'No books match the chosen subject or keywords. Try resetting your search filters.'
              : 'Your tutor has not published any PDF textbooks for this subject yet.'}
          </p>
          {(searchQuery || activeSubject !== 'all' || activeCategory !== 'all') && (
            <button
              onClick={() => {
                setActiveSubject('all');
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const cfg = SUBJECT_CONFIG[doc.subjectName] || {
              badge: 'bg-slate-100 text-slate-800 border-slate-200',
              accentText: 'text-orange-600',
              btnBg: 'bg-orange-500 hover:bg-orange-600 text-white',
              subBg: 'bg-slate-50'
            };

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between group space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${cfg.badge}`}
                    >
                      {doc.subjectName}
                    </span>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {doc.category || 'Textbook'}
                    </span>
                  </div>

                  {/* Document Title & Description */}
                  <div>
                    <h3 className="font-display text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-slate-500 text-xs font-medium mt-2 line-clamp-3 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Meta pill info */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{doc.fileSizeFormatted || 'PDF'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 font-semibold text-[10px]">
                      <span>{doc.pageCount ? `${doc.pageCount} Pages` : 'Multi-Page'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-slate-400" />
                        <span>{doc.downloadCount || 0} downloads</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Student Actions (Read & Download) */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                  {/* Read Online Button */}
                  <button
                    type="button"
                    onClick={() => setActiveReadingDoc(doc)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <BookOpen className="w-4 h-4 stroke-[2.5]" />
                    <span>Read Online</span>
                  </button>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                    title="Download PDF to computer / phone"
                  >
                    <Download className="w-4 h-4 text-slate-600 stroke-[2.5]" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN RESPONSIVE STUDENT PDF READER MODAL */}
      {/* ========================================================================= */}
      {activeReadingDoc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          {/* Reader Top Bar */}
          <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <h3 className="font-display text-sm sm:text-base font-black truncate">
                  {activeReadingDoc.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="uppercase font-bold text-orange-400">{activeReadingDoc.subjectName}</span>
                  <span>•</span>
                  <span>{activeReadingDoc.fileName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Download */}
              <button
                onClick={() => handleDownload(activeReadingDoc)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>

              {/* Open in external tab */}
              <a
                href={resolveAssetUrl(activeReadingDoc.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Close Reader */}
              <button
                onClick={() => setActiveReadingDoc(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded Fullscreen PDF Frame */}
          <div className="flex-1 w-full bg-slate-900 relative">
            <iframe
              src={`${resolveAssetUrl(activeReadingDoc.fileUrl)}#toolbar=1&navpanes=0`}
              title={activeReadingDoc.title}
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
