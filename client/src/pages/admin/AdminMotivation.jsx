import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import {
  Flame,
  Plus,
  Search,
  Sparkles,
  Star,
  Play,
  Edit2,
  Trash2,
  Eye,
  Heart,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Video,
  Clock,
  RefreshCw,
  Share2
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Exam Focus & Struggle',
  'Never Give Up',
  'Dream Big & Mindset',
  'Discipline & Daily Habits',
  'Topper Study Strategies'
];

export function AdminMotivation() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    youtubeUrl: '',
    title: '',
    speaker: '',
    quote: '',
    category: 'Exam Focus & Struggle',
    tags: '',
    isSpotlight: false,
    status: 'active'
  });
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [metaPreview, setMetaPreview] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/motivation');
      setVideos(res.videos || []);
    } catch (err) {
      console.error('Failed to load motivation videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Auto-fetch YouTube metadata when URL is pasted
  const handleUrlChange = async (url) => {
    setFormData((prev) => ({ ...prev, youtubeUrl: url }));

    if (url.includes('youtu.be/') || url.includes('youtube.com/')) {
      setIsFetchingMeta(true);
      try {
        const res = await api.get(`/motivation/fetch-meta?url=${encodeURIComponent(url)}`);
        setMetaPreview(res);
        setFormData((prev) => ({
          ...prev,
          title: prev.title || res.title || '',
          speaker: prev.speaker || res.speaker || ''
        }));
      } catch (err) {
        console.warn('Could not auto-fetch YouTube metadata:', err);
      } finally {
        setIsFetchingMeta(false);
      }
    } else {
      setMetaPreview(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setMetaPreview(null);
    setFormData({
      youtubeUrl: '',
      title: '',
      speaker: '',
      quote: '',
      category: 'Exam Focus & Struggle',
      tags: 'Study, Motivation, ICSE',
      isSpotlight: false,
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (video) => {
    setEditingVideo(video);
    setMetaPreview({
      thumbnailUrl: video.thumbnailUrl,
      youtubeId: video.youtubeId,
      embedUrl: video.embedUrl
    });
    setFormData({
      youtubeUrl: video.youtubeUrl || `https://youtu.be/${video.youtubeId}`,
      title: video.title || '',
      speaker: video.speaker || '',
      quote: video.quote || '',
      category: video.category || 'Exam Focus & Struggle',
      tags: Array.isArray(video.tags) ? video.tags.join(', ') : '',
      isSpotlight: Boolean(video.isSpotlight),
      status: video.status || 'active'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.youtubeUrl.trim()) {
      alert('Please enter a YouTube video URL.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []
      };

      if (editingVideo) {
        const res = await api.put(`/admin/motivation/${editingVideo.id}`, payload);
        setVideos((prev) =>
          prev.map((v) => (v.id === editingVideo.id ? res.video : v))
        );
      } else {
        const res = await api.post('/admin/motivation', payload);
        setVideos((prev) => [res.video, ...prev]);
      }
      setShowModal(false);
      fetchVideos();
    } catch (err) {
      alert(err.message || 'Failed to save video.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to remove this video: "${title}"?`)) return;
    try {
      await api.delete(`/admin/motivation/${id}`);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete video.');
    }
  };

  const handleSetSpotlight = async (id) => {
    try {
      await api.post(`/admin/motivation/${id}/spotlight`, {});
      setVideos((prev) =>
        prev.map((v) => ({
          ...v,
          isSpotlight: v.id === id
        }))
      );
    } catch (err) {
      alert(err.message || 'Failed to set spotlight.');
    }
  };

  // Filtered List
  const filteredVideos = videos.filter((v) => {
    if (selectedCategory !== 'All' && v.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = v.title?.toLowerCase().includes(q);
      const matchSpeaker = v.speaker?.toLowerCase().includes(q);
      const matchQuote = v.quote?.toLowerCase().includes(q);
      return matchTitle || matchSpeaker || matchQuote;
    }
    return true;
  });

  const spotlightVideo = videos.find((v) => v.isSpotlight);
  const totalCheers = videos.reduce((acc, v) => acc + (v.cheersCount || 0), 0);
  const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-5 h-5 fill-current" />
            </span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Student Motivation Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-display">
            Daily Motivation & Video Spotlight
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Curate powerful YouTube study motivation reels & lectures. Features automatic daily rotation and 1-click spotlight.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Motivation Video</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase">Total Videos</div>
            <div className="text-xl font-black text-text">{videos.length}</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-bold text-text-muted uppercase">Today's Spotlight</div>
            <div className="text-xs font-bold text-text truncate">
              {spotlightVideo ? spotlightVideo.speaker || 'Featured Video' : 'Auto-Rotating'}
            </div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase">Student Cheers</div>
            <div className="text-xl font-black text-text">{totalCheers} ❤️</div>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-text-muted uppercase">Total Video Views</div>
            <div className="text-xl font-black text-text">{totalViews}</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, speaker (e.g. Khan Sir, Kalam), or quote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:bg-page'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-text-muted text-sm flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Loading motivational videos...</span>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-text">No motivational videos found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Add YouTube video URLs like Khan Sir, Kalam, or study inspiration to motivate students daily.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
          >
            + Add First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className={`bg-surface rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group hover:shadow-md ${
                video.isSpotlight
                  ? 'border-orange-400 ring-2 ring-orange-400/20 shadow-sm'
                  : 'border-border hover:border-border-strong'
              }`}
            >
              <div>
                {/* Video Thumbnail with Play Overlay */}
                <div className="relative aspect-video bg-black/10 overflow-hidden cursor-pointer" onClick={() => setPreviewVideo(video)}>
                  <img
                    src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Spotlight Banner Badge */}
                  {video.isSpotlight && (
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-[11px] font-black flex items-center gap-1 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Today's Daily Spotlight</span>
                    </div>
                  )}

                  {/* Speaker Pill */}
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold">
                    {video.speaker || 'Study Mentor'}
                  </div>

                  {/* Views & Cheers */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2 text-white text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-md">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> {video.viewsCount || 0}
                    </span>
                    <span className="flex items-center gap-0.5 text-rose-400">
                      <Heart className="w-3 h-3 fill-current" /> {video.cheersCount || 0}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
                      {video.category || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        video.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {video.status === 'active' ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <h3
                    onClick={() => setPreviewVideo(video)}
                    className="font-bold text-sm text-text line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer leading-snug"
                    title={video.title}
                  >
                    {video.title}
                  </h3>

                  {video.quote && (
                    <blockquote className="text-xs text-text-muted italic bg-page p-2.5 rounded-xl border-l-2 border-orange-500 line-clamp-2">
                      "{video.quote}"
                    </blockquote>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-page/50 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => handleSetSpotlight(video.id)}
                  disabled={video.isSpotlight}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    video.isSpotlight
                      ? 'bg-orange-100 text-orange-800 cursor-default'
                      : 'border border-border bg-surface hover:bg-orange-50 text-text-muted hover:text-orange-600'
                  }`}
                  title="Make this video today's Daily Motivation for students"
                >
                  <Star className={`w-3.5 h-3.5 ${video.isSpotlight ? 'fill-current' : ''}`} />
                  <span>{video.isSpotlight ? 'Featured' : 'Make Daily'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewVideo(video)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-orange-600 hover:bg-page"
                    title="Watch video preview"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(video)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-page"
                    title="Edit video"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id, video.title)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-page"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT VIDEO MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-surface rounded-2xl border border-border p-6 max-w-lg w-full space-y-4 shadow-2xl my-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-current" />
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-text">
                  {editingVideo ? 'Edit Motivation Video' : 'Add New Motivation Video'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube URL input */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                YouTube Video Link * <span className="font-normal text-text-muted">(Supports watch, youtu.be & shorts)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.youtubeUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="e.g. https://youtu.be/3pg0nzainMo or https://youtu.be/2OI6OErC3Jk"
                  className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium"
                />
                {isFetchingMeta && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Auto-detected Preview Card */}
            {metaPreview && (
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-center gap-3">
                <img
                  src={metaPreview.thumbnailUrl}
                  alt="Thumb"
                  className="w-20 aspect-video object-cover rounded-lg shadow-2xs shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="text-[10px] font-bold text-orange-700 uppercase">YouTube Detected</div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {metaPreview.title || 'Video identified'}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    ID: {metaPreview.youtubeId} · Channel: {metaPreview.speaker || 'YouTube'}
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">Video Headline / Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. विजयी होने के लिए संघर्ष करना होगा | Khan Sir"
                className="w-full px-3 py-2 border border-border rounded-xl text-xs sm:text-sm bg-page text-text font-medium"
              />
            </div>

            {/* Speaker & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Speaker / Mentor</label>
                <input
                  type="text"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  placeholder="e.g. Khan Sir, Dr. APJ Abdul Kalam..."
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-page text-text font-bold"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Motivational Quote / Key Takeaway */}
            <div>
              <label className="block text-xs font-bold text-text mb-1">
                Inspiring Quote / Key Lesson (Shown prominently to students)
              </label>
              <textarea
                rows={2}
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="e.g. मेहनत इतनी खामोशी से करो कि तुम्हारी सफलता शोर मचा दे!"
                className="w-full p-2.5 border border-border rounded-xl text-xs bg-page text-text"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSpotlight}
                  onChange={(e) => setFormData({ ...formData, isSpotlight: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded border-border focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-text flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-orange-500 fill-current" />
                  Set as Today's Daily Spotlight Video
                </span>
              </label>

              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-2.5 py-1 rounded-lg border border-border text-xs bg-page text-text font-medium"
              >
                <option value="active">Active (Visible)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingVideo ? 'Update Video' : 'Save & Publish Video'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  {previewVideo.speaker || 'Motivational Video'}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-text line-clamp-1">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Responsive 16:9 Iframe */}
            <div className="relative aspect-video bg-black w-full">
              <iframe
                src={`${previewVideo.embedUrl}?autoplay=1`}
                title={previewVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {previewVideo.quote && (
              <div className="p-4 pt-1">
                <blockquote className="text-xs text-text italic bg-page p-3 rounded-xl border-l-2 border-orange-500">
                  "{previewVideo.quote}"
                </blockquote>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMotivation;
