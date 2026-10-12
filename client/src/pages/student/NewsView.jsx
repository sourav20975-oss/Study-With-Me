import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MathRenderer } from '../../components/common/MathRenderer.jsx';
import {
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Check,
  Send,
  ExternalLink
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Space & Astronomy',
  'Environment & Agriculture',
  'Physics & Machines',
  'Biology & Nature',
  'Chemistry & Earth',
  'ICSE Discoveries'
];

const CATEGORY_STYLES = {
  'Space & Astronomy': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Environment & Agriculture': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Physics & Machines': 'bg-orange-100 text-orange-800 border-orange-200',
  'Biology & Nature': 'bg-teal-100 text-teal-800 border-teal-200',
  'Chemistry & Earth': 'bg-rose-100 text-rose-800 border-rose-200',
  'ICSE Discoveries': 'bg-amber-100 text-amber-800 border-amber-200'
};

export function NewsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Admin only: 'all' | 'published' | 'draft'

  // Modals
  const [readingArticle, setReadingArticle] = useState(null); // Full reader modal
  const [showEditorModal, setShowEditorModal] = useState(false); // Create/Edit modal
  const [editingArticle, setEditingArticle] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false); // AI Generator modal

  // Article Form State
  const [articleForm, setArticleForm] = useState({
    title: '',
    category: 'Space & Astronomy',
    description: '',
    content: '',
    image: '',
    source: 'Tutor Desk',
    readTimeMinutes: 3,
    status: 'published'
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI Generator Form State
  const [aiTopic, setAiTopic] = useState('Chandrayaan Lunar Water Exploration');
  const [aiCategory, setAiCategory] = useState('Space & Astronomy');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/news?role=admin' : '/news';
      const res = await api.get(endpoint);
      setArticles(res.articles || []);
    } catch (err) {
      console.error('Failed to load science articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [isAdmin]);

  // Handle Cover Image Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await api.upload(file);
      setArticleForm((prev) => ({ ...prev, image: res.url }));
    } catch (err) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      category: 'Space & Astronomy',
      description: '',
      content: '',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      source: 'Tutor Science Desk',
      readTimeMinutes: 3,
      status: 'published'
    });
    setShowEditorModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (art) => {
    setEditingArticle(art);
    setArticleForm({
      title: art.title || '',
      category: art.category || 'Space & Astronomy',
      description: art.description || '',
      content: art.content || art.description || '',
      image: art.image || '',
      source: art.source?.name || art.source || 'Tutor Science Desk',
      readTimeMinutes: art.readTimeMinutes || 3,
      status: art.status || 'published'
    });
    setShowEditorModal(true);
  };

  // Save Article (Create or Update)
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.description.trim()) {
      alert('Please fill in title and description.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingArticle) {
        const res = await api.patch(`/admin/news/${editingArticle.id}`, articleForm);
        setArticles((prev) =>
          prev.map((a) => (a.id === editingArticle.id ? res.article : a))
        );
      } else {
        const res = await api.post('/admin/news', articleForm);
        setArticles((prev) => [res.article, ...prev]);
      }

      setShowEditorModal(false);
      setEditingArticle(null);
    } catch (err) {
      alert(err.message || 'Failed to save science article.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (artId, title) => {
    if (!window.confirm(`Are you sure you want to delete article: "${title}"?`)) return;

    try {
      await api.delete(`/admin/news/${artId}`);
      setArticles((prev) => prev.filter((a) => a.id !== artId));
    } catch (err) {
      alert(err.message || 'Failed to delete article.');
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (art) => {
    try {
      const res = await api.post(`/admin/news/${art.id}/toggle-publish`, {});
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? res.article : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  // AI Generate Article Draft
  const handleGenerateAIArticle = async (e) => {
    e.preventDefault();
    setIsGeneratingAI(true);
    try {
      const res = await api.post('/admin/news/ai-generate', {
        topic: aiTopic,
        category: aiCategory
      });

      setArticleForm({
        ...res.article,
        status: 'published'
      });
      setShowAIModal(false);
      setEditingArticle(null);
      setShowEditorModal(true);
    } catch (err) {
      alert(err.message || 'Failed to generate article.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Like Article (Student or Tutor)
  const handleLike = async (artId) => {
    try {
      const res = await api.post(`/news/${artId}/like`, {});
      setArticles((prev) =>
        prev.map((a) => (a.id === artId ? { ...a, likesCount: res.likesCount } : a))
      );
      if (readingArticle && readingArticle.id === artId) {
        setReadingArticle((prev) => ({ ...prev, likesCount: res.likesCount }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter articles
  const filteredArticles = articles.filter((a) => {
    if (selectedCategory !== 'All' && a.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (isAdmin && statusFilter !== 'all' && a.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title?.toLowerCase().includes(q);
      const matchDesc = a.description?.toLowerCase().includes(q);
      const matchCat = a.category?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
              {isAdmin ? 'Science Feed Publishing Studio' : 'Science Feed & Daily Discoveries'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            {isAdmin
              ? 'Publish inspiring space, biology, and physics discoveries for your Class 8 students.'
              : 'Explore verified science breakthroughs, space exploration, and real-world ICSE applications.'}
          </p>
        </div>

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ AI Article Generator</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Publish New Article</span>
            </button>
          </div>
        )}
      </div>

      {/* Admin Stats Bar */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface border border-border shadow-2xs">
            <div className="text-xs font-semibold text-text-muted">Total Science Posts</div>
            <div className="text-xl font-bold text-text mt-0.5">{articles.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <div className="text-xs font-semibold text-emerald-700">Published Live for Students</div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{publishedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface border border-border shadow-2xs">
            <div className="text-xs font-semibold text-text-muted">Drafts (Hidden)</div>
            <div className="text-xl font-bold text-text mt-0.5">{draftCount}</div>
          </div>
        </div>
      )}

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-accent text-white shadow-2xs'
                  : 'bg-page border border-border text-text hover:bg-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Status filter */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-page text-xs text-text font-bold"
            >
              <option value="all">All Status</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          )}

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search science articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs bg-page text-text focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="py-16 text-center text-text-muted">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold">Loading Science Feed...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center text-text-muted bg-surface rounded-2xl border border-border p-6 space-y-3">
          <Newspaper className="w-10 h-10 mx-auto text-text-muted/50 stroke-[1.5]" />
          <p className="text-sm font-semibold">
            {isAdmin ? 'No science articles created yet.' : 'No science articles published yet by your tutor.'}
          </p>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {isAdmin
              ? 'Click "+ Publish New Article" or use the AI Generator to share exciting space and biology discoveries.'
              : 'Your tutor will publish inspiring science updates, ISRO missions, and ICSE discoveries here soon.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Publish First Article</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => {
            const catClass = CATEGORY_STYLES[art.category] || 'bg-slate-100 text-slate-800 border-slate-200';
            const isPub = art.status === 'published';

            return (
              <div
                key={art.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden flex flex-col justify-between shadow-2xs hover:border-accent/50 hover:shadow-sm transition-all group"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={art.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Admin Status Pill on image */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(art)}
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm transition-all ${
                          isPub
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-800/80 text-white hover:bg-slate-900'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {isPub ? '● Live for Students' : '○ Draft (Hidden)'}
                      </button>
                    )}

                    <div className="absolute bottom-2.5 left-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${catClass}`}>
                        {art.category || 'Science'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="font-semibold text-accent truncate">
                        {art.source?.name || art.source || 'Tutor Special'}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{art.readTimeMinutes || 3} min read</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                      {art.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 sm:p-5 pt-0 border-t border-border/60 mt-2 flex items-center justify-between gap-2">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleLike(art.id)}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-rose-600 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span className="font-bold text-[11px]">{art.likesCount || 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Admin Edit/Delete */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(art)}
                          className="p-1.5 text-text-muted hover:text-accent hover:bg-page rounded-lg transition-colors"
                          title="Edit article"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(art.id, art.title)}
                          className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* Read Full Story Button */}
                    <button
                      type="button"
                      onClick={() => setReadingArticle(art)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-page border border-border hover:border-accent text-accent text-xs font-bold transition-all shadow-2xs hover:bg-surface active:scale-95"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL ARTICLE READER MODAL */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-6 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border p-4 flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                CATEGORY_STYLES[readingArticle.category] || 'bg-slate-100 text-slate-800'
              }`}>
                {readingArticle.category}
              </span>

              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {readingArticle.image && (
                <div className="rounded-xl overflow-hidden aspect-video w-full bg-slate-100 shadow-xs">
                  <img
                    src={readingArticle.image}
                    alt={readingArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="font-bold text-accent">{readingArticle.source?.name || readingArticle.source || 'Tutor Special'}</span>
                  <span>•</span>
                  <span>{readingArticle.readTimeMinutes || 3} min read</span>
                </div>
                <h2 className="font-editorial text-xl sm:text-2xl font-bold text-text leading-snug">
                  {readingArticle.title}
                </h2>
              </div>

              {/* Summary Callout */}
              <div className="p-3.5 rounded-xl bg-page border border-border text-xs sm:text-sm text-text-muted italic leading-relaxed">
                "{readingArticle.description}"
              </div>

              {/* Full Content */}
              <div className="text-xs sm:text-sm text-text leading-relaxed space-y-3 prose prose-slate max-w-none pt-2">
                <MathRenderer content={readingArticle.content || readingArticle.description} />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleLike(readingArticle.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
                >
                  <Heart className="w-4 h-4 fill-rose-500" />
                  <span>Helpful ({readingArticle.likesCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-bold"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT ARTICLE MODAL (ADMIN ONLY) */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveArticle}
            className="bg-surface rounded-2xl border border-border p-6 max-w-xl w-full space-y-4 shadow-2xl my-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-text">
                {editingArticle ? 'Edit Science Article' : 'Publish Science Article'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">Article Headline *</label>
              <input
                type="text"
                required
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                placeholder="e.g. How Sound Waves Travel Through Different Media"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium focus:outline-none focus:border-accent"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Category</label>
                <select
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Visibility Status</label>
                <select
                  value={articleForm.status}
                  onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  <option value="published">Published (Visible to Students)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Cover Image Upload / URL */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">Cover Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={articleForm.image}
                  onChange={(e) => setArticleForm({ ...articleForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-1.5 border border-border rounded-xl text-xs bg-page text-text"
                />
                <label className="px-3 py-1.5 rounded-xl border border-dashed border-border hover:border-accent bg-page text-xs font-bold cursor-pointer text-text flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Description / Summary */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">Short Summary (1-2 sentences) *</label>
              <textarea
                rows={2}
                required
                value={articleForm.description}
                onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                placeholder="Hook the student with an intriguing finding..."
                className="w-full p-2.5 border border-border rounded-xl text-xs bg-page text-text leading-relaxed"
              />
            </div>

            {/* Full Content */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Full Article Content & ICSE Connections (Markdown & LaTeX supported):
              </label>
              <textarea
                rows={6}
                required
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                placeholder="### Heading&#10;Explain the science concept step-by-step with real-world examples..."
                className="w-full p-3 border border-border rounded-xl text-xs bg-page text-text font-mono leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold active:scale-95 transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI GENERATOR MODAL (ADMIN ONLY) */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleGenerateAIArticle}
            className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full space-y-4 shadow-2xl my-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-editorial text-lg font-bold text-text">
                  AI Science Article Generator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Enter any science or space exploration topic, and AI will generate a complete, engaging article draft connecting to ICSE Class 8 concepts.
            </p>

            <div>
              <label className="block text-xs font-bold text-text mb-1">Science Topic / Discovery</label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Chandrayaan-3 Rover, How Solar Cells Work, Bioluminescence..."
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text mb-1">Category</label>
              <select
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGeneratingAI}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAI ? 'Drafting...' : 'Generate Draft'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default NewsView;
