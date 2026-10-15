import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import {
  Flame,
  Star,
  Play,
  Heart,
  Eye,
  Share2,
  CheckCircle2,
  Search,
  Sparkles,
  X,
  Volume2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Exam Focus & Struggle',
  'Never Give Up',
  'Dream Big & Mindset',
  'Discipline & Daily Habits',
  'Topper Study Strategies'
];

export function DailyMotivationView() {
  const [dailyVideo, setDailyVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Active playing modal
  const [activeModalVideo, setActiveModalVideo] = useState(null);

  // Student interaction states
  const [hasCheered, setHasCheered] = useState({});
  const [isWatched, setIsWatched] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const fetchDailyAndLibrary = async () => {
    setLoading(true);
    try {
      const [dailyRes, listRes] = await Promise.all([
        api.get('/motivation/daily').catch(() => ({ video: null })),
        api.get('/motivation').catch(() => ({ videos: [] }))
      ]);

      const daily = dailyRes.video || listRes.videos?.[0] || null;
      setDailyVideo(daily);
      setAllVideos(listRes.videos || []);

      // Check localStorage for today's watched status
      const todayKey = `watched_mot_${new Date().toISOString().slice(0, 10)}`;
      if (localStorage.getItem(todayKey)) {
        setIsWatched(true);
      }
    } catch (err) {
      console.error('Failed to load motivation videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAndLibrary();
  }, []);

  const handleCheer = async (videoId) => {
    if (hasCheered[videoId]) return;
    setHasCheered((prev) => ({ ...prev, [videoId]: true }));

    try {
      const res = await api.post(`/motivation/${videoId}/cheer`, {});
      if (dailyVideo && dailyVideo.id === videoId) {
        setDailyVideo((prev) => ({ ...prev, cheersCount: res.cheersCount }));
      }
      setAllVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, cheersCount: res.cheersCount } : v))
      );
    } catch (err) {
      console.warn('Cheer request error:', err);
    }
  };

  const handleToggleWatched = () => {
    const todayKey = `watched_mot_${new Date().toISOString().slice(0, 10)}`;
    const nextVal = !isWatched;
    setIsWatched(nextVal);
    if (nextVal) {
      localStorage.setItem(todayKey, 'true');
    } else {
      localStorage.removeItem(todayKey);
    }
  };

  const handleCopyQuote = (quoteText) => {
    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const filteredVideos = allVideos.filter((v) => {
    if (selectedCategory !== 'All' && v.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.title?.toLowerCase().includes(q) ||
        v.speaker?.toLowerCase().includes(q) ||
        v.quote?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4 fill-current" />
            </span>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              StudySathi Inspiration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-display">
            Daily Motivation for Students
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Recharge your mindset every day with inspiring talks from mentors, educators, and leaders.
          </p>
        </div>

        {/* Daily Streak Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold shrink-0 self-start sm:self-auto">
          <Award className="w-4 h-4 text-orange-500" />
          <span>{isWatched ? 'Today\'s Inspiration Completed! 🌟' : 'Ready for Today\'s Dose?'}</span>
        </div>
      </div>

      {/* TODAY'S FEATURED SPOTLIGHT HERO */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-surface border border-border text-center text-text-muted flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Loading today's motivation...</span>
        </div>
      ) : dailyVideo ? (
        <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-4 sm:p-7 text-white shadow-xl space-y-6 relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          {/* Spotlight Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Star className="w-3.5 h-3.5 fill-current text-amber-200" />
                <span>Today's Daily Motivation</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/25 text-orange-100 text-[11px] font-bold">
                {dailyVideo.category || 'Focus & Drive'}
              </span>
            </div>

            <div className="text-xs text-orange-100 font-semibold">
              Speaker: <strong className="text-white font-bold">{dailyVideo.speaker || 'Study Mentor'}</strong>
            </div>
          </div>

          {/* Main Grid: 16:9 Video Player + Quote Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center relative z-10">
            {/* Embedded Responsive YouTube Player */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-white/20 aspect-video w-full">
              <iframe
                src={`${dailyVideo.embedUrl}?rel=0`}
                title={dailyVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Right Card: Quote & Student Cheer */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/25 shadow-lg">
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-extrabold leading-snug font-display text-white line-clamp-2">
                  {dailyVideo.title}
                </h2>

                {dailyVideo.quote && (
                  <div className="relative pt-2">
                    <span className="text-4xl text-amber-200 font-serif leading-none absolute -top-1 -left-1 opacity-70">“</span>
                    <p className="text-sm sm:text-base italic font-serif leading-relaxed text-orange-50 pl-5">
                      {dailyVideo.quote}
                    </p>
                    <span className="text-4xl text-amber-200 font-serif leading-none float-right -mt-2 opacity-70">”</span>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
                {/* Cheer Button */}
                <button
                  onClick={() => handleCheer(dailyVideo.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
                    hasCheered[dailyVideo.id]
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-orange-950 hover:bg-orange-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${hasCheered[dailyVideo.id] ? 'fill-current' : 'text-rose-500 fill-current'}`} />
                  <span>
                    {hasCheered[dailyVideo.id] ? 'Inspired! ❤️' : 'Inspired Me'} ({dailyVideo.cheersCount || 0})
                  </span>
                </button>

                {/* Mark as Watched / Streak check */}
                <button
                  onClick={handleToggleWatched}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isWatched
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isWatched ? 'Watched Today ✓' : 'Mark Watched'}</span>
                </button>

                {/* Copy Quote */}
                {dailyVideo.quote && (
                  <button
                    onClick={() => handleCopyQuote(`"${dailyVideo.quote}" — ${dailyVideo.speaker || 'StudySathi'}`)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all text-xs font-semibold flex items-center gap-1"
                    title="Copy Quote"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedQuote ? 'Copied!' : 'Quote'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* EXPLORE MORE MOTIVATION VIDEOS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span>Inspiration Library & Top Mentors</span>
            </h2>
            <p className="text-xs text-text-muted">
              Handpicked study strategy, focus, and mindset sessions for ICSE Class 8 students.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mentor or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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

        {/* Grid of Video Cards */}
        {filteredVideos.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-10 text-center text-text-muted text-xs">
            No motivation videos found under this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveModalVideo(vid)}
                className="bg-surface rounded-2xl border border-border hover:border-orange-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black/10 overflow-hidden">
                    <img
                      src={vid.thumbnailUrl || `https://i.ytimg.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold">
                      {vid.speaker}
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400 fill-current" />
                      <span>{vid.cheersCount || 0}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 uppercase tracking-wider">
                        {vid.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-text line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                      {vid.title}
                    </h3>

                    {vid.quote && (
                      <p className="text-xs text-text-muted italic line-clamp-2 bg-page p-2 rounded-lg border-l-2 border-orange-400">
                        "{vid.quote}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-page/40 border-t border-border flex items-center justify-between text-xs font-bold text-orange-600">
                  <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Watch Video</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] text-text-muted font-medium">YouTube</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FULL VIDEO PLAYER MODAL */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="overflow-hidden pr-2">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  {activeModalVideo.speaker || 'Study Mentor'}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-text truncate">
                  {activeModalVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-page shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black w-full">
              <iframe
                src={`${activeModalVideo.embedUrl}?autoplay=1&rel=0`}
                title={activeModalVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Bottom Quote & Cheer */}
            <div className="p-4 pt-1 flex items-center justify-between gap-3">
              {activeModalVideo.quote ? (
                <blockquote className="text-xs text-text italic flex-1 bg-page p-2.5 rounded-xl border-l-2 border-orange-500">
                  "{activeModalVideo.quote}"
                </blockquote>
              ) : <div />}

              <button
                onClick={() => handleCheer(activeModalVideo.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Heart className="w-4 h-4 fill-current text-rose-500" />
                <span>{hasCheered[activeModalVideo.id] ? 'Inspired! ❤️' : 'Inspire'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyMotivationView;
