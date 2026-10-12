import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import {
  FolderTree,
  Plus,
  Trash2,
  BookOpen,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');

  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const [showAddChapModal, setShowAddChapModal] = useState(false);
  const [newChapTitle, setNewChapTitle] = useState('');
  const [newChapDesc, setNewChapDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const sRes = await api.get('/subjects');
      setSubjects(sRes.subjects || []);
      if (sRes.subjects?.length > 0) {
        const firstId = selectedSubId || sRes.subjects[0].id;
        setSelectedSubId(firstId);
        const chapRes = await api.get(`/subjects/${firstId}/chapters`);
        setChapters(chapRes.chapters || []);
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

  const handleSelectSubject = async (subId) => {
    setSelectedSubId(subId);
    try {
      const res = await api.get(`/subjects/${subId}/chapters`);
      setChapters(res.chapters || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.post('/admin/subjects', {
        name: newSubName.trim(),
        description: newSubDesc.trim(),
        grade: 'Class 8'
      });
      setShowAddSubModal(false);
      setNewSubName('');
      setNewSubDesc('');
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!newChapTitle.trim() || !selectedSubId) return;
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.post(`/admin/subjects/${selectedSubId}/chapters`, {
        title: newChapTitle.trim(),
        description: newChapDesc.trim()
      });
      setShowAddChapModal(false);
      setNewChapTitle('');
      setNewChapDesc('');
      await handleSelectSubject(selectedSubId);
      // Refresh subject chapter counts
      const sRes = await api.get('/subjects');
      setSubjects(sRes.subjects || []);
    } catch (err) {
      setModalError(err.message || 'Failed to add chapter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapId) => {
    if (!confirm('Are you sure you want to remove this chapter?')) return;
    try {
      await api.delete(`/admin/chapters/${chapId}`);
      setChapters((prev) => prev.filter((c) => c.id !== chapId));
      // Refresh count
      const sRes = await api.get('/subjects');
      setSubjects(sRes.subjects || []);
    } catch (err) {
      alert(err.message || 'Failed to delete chapter.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading syllabus & chapters...</p>
      </div>
    );
  }

  const activeSub = subjects.find((s) => s.id === selectedSubId);

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Curriculum Manager
            </span>
            <span className="text-xs text-slate-400 font-medium">Class 8 ICSE</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subjects & Chapters Hierarchy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize study units, notes, and question banks by subject and chapter.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError('');
            setShowAddSubModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Subject</span>
        </button>
      </div>

      {/* 2-Column Hierarchy View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left: Subjects List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-1">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-orange-500" />
              <h2 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider">
                Subjects ({subjects.length})
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubId;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-orange-50 text-orange-700 border-orange-300 shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm block leading-tight">{sub.name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">Class 8</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      isSelected
                        ? 'bg-orange-200/60 text-orange-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {sub.chapterCount || chapters.length} chaps
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Chapters in Selected Subject (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {activeSub?.name || 'Selected'} Chapters
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSub?.description || 'All chapters under this subject curriculum.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/admin/notes?subjectId=${selectedSubId}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                <span>View Notes</span>
              </Link>

              <button
                onClick={() => {
                  setModalError('');
                  setShowAddChapModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-extrabold shadow-sm shadow-orange-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Chapter</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {chapters.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">No chapters added yet</p>
                  <p className="text-xs text-slate-500">
                    Click the orange "Add Chapter" button to create chapter 1 for {activeSub?.name}.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddChapModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Chapter</span>
                </button>
              </div>
            ) : (
              chapters.map((chap, idx) => (
                <div
                  key={chap.id}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                        Ch {chap.sortOrder || idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {chap.title}
                      </h3>
                    </div>
                    {chap.description && (
                      <p className="text-xs text-slate-500 leading-relaxed pl-1 line-clamp-2">
                        {chap.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <Link
                      to={`/admin/notes?subjectId=${selectedSubId}&chapterId=${chap.id}&action=new`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs transition-colors shadow-2xs"
                      title="Write a new study note for this chapter"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Write Note</span>
                    </Link>

                    <Link
                      to={`/admin/notes?subjectId=${selectedSubId}&chapterId=${chap.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
                      title="View all notes for this chapter"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Notes</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteChapter(chap.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Remove Chapter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal: Add Chapter (Solid White Card, Crisp Dark Backdrop, Visible Buttons) */}
      {/* ========================================================================= */}
      {showAddChapModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 relative animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900">
                    Add Chapter to {activeSub?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a new chapter under Class 8 {activeSub?.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddChapModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chapter Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newChapTitle}
                  onChange={(e) => setNewChapTitle(e.target.value)}
                  placeholder="e.g. Data Handling & Graphs"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Topics Covered
                </label>
                <textarea
                  rows={3}
                  value={newChapDesc}
                  onChange={(e) => setNewChapDesc(e.target.value)}
                  placeholder="Key concepts covered (e.g. Bar charts, pie graphs, central tendency)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChapModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newChapTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Add Chapter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Add Subject */}
      {/* ========================================================================= */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900">
                    Add New Subject
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a new subject curriculum unit for Class 8
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSubModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Sanskrit, Hindi, or Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  placeholder="Brief curriculum description..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Create Subject</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

