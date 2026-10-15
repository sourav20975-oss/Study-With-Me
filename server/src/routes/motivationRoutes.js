import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

export function extractYouTubeId(url = '') {
  if (!url) return null;
  const str = url.trim();

  const shortMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortsMatch = str.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = str.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  return null;
}

const DEFAULT_MOTIVATION_VIDEOS = [
  {
    id: 'mot-khan-sir-1',
    title: 'विजयी होने के लिए संघर्ष करना होगा 🔥 | Best Study Motivation',
    youtubeUrl: 'https://youtu.be/3pg0nzainMo',
    youtubeId: '3pg0nzainMo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/3pg0nzainMo',
    thumbnailUrl: 'https://i.ytimg.com/vi/3pg0nzainMo/hqdefault.jpg',
    speaker: 'Khan Sir (KGS)',
    quote: 'मेहनत इतनी खामोशी से करो कि तुम्हारी सफलता शोर मचा दे! संघर्ष ही जीत का रास्ता है।',
    category: 'Exam Focus & Struggle',
    tags: ['Study Motivation', 'Khan Sir', 'Discipline', 'Success'],
    isSpotlight: true,
    status: 'active',
    cheersCount: 68,
    viewsCount: 245,
    createdAt: '2026-10-15T08:00:00.000Z'
  },
  {
    id: 'mot-success-2',
    title: '🔥 "सपना तेरा है... तो तड़प भी तेरे अंदर होनी चाहिए!" Powerful Study Motivation',
    youtubeUrl: 'https://youtu.be/2OI6OErC3Jk',
    youtubeId: '2OI6OErC3Jk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/2OI6OErC3Jk',
    thumbnailUrl: 'https://i.ytimg.com/vi/2OI6OErC3Jk/hqdefault.jpg',
    speaker: 'Success Study Motivation',
    quote: 'जब तक तोड़ेंगे नहीं, तब तक छोड़ेंगे नहीं! अपने सपनों के लिए हर दिन पूरी लगन से मेहनत करो।',
    category: 'Never Give Up',
    tags: ['Dreams', 'Passion', 'Consistency', 'Hard Work'],
    isSpotlight: false,
    status: 'active',
    cheersCount: 54,
    viewsCount: 189,
    createdAt: '2026-10-15T09:00:00.000Z'
  },
  {
    id: 'mot-kalam-3',
    title: 'Dr. APJ Abdul Kalam on Dreams & Dedication for Students',
    youtubeUrl: 'https://youtu.be/d3Xy7Wqj5oE',
    youtubeId: 'd3Xy7Wqj5oE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/d3Xy7Wqj5oE',
    thumbnailUrl: 'https://i.ytimg.com/vi/d3Xy7Wqj5oE/hqdefault.jpg',
    speaker: 'Dr. A.P.J. Abdul Kalam',
    quote: 'सपने वो नहीं होते जो आप सोते वक्त देखते हैं, सपने वो होते हैं जो आपको सोने नहीं देते।',
    category: 'Dream Big & Mindset',
    tags: ['Kalam', 'Vision', 'Education', 'Inspiration'],
    isSpotlight: false,
    status: 'active',
    cheersCount: 92,
    viewsCount: 310,
    createdAt: '2026-10-14T08:00:00.000Z'
  }
];

function ensureMotivationInitialized() {
  const existing = store.get('motivation_videos');
  if (!existing || existing.length === 0) {
    DEFAULT_MOTIVATION_VIDEOS.forEach((vid) => {
      store.create('motivation_videos', vid);
    });
  }
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// ---------------------------------------------------------------------------
// Student & Public Routes
// ---------------------------------------------------------------------------

// Fetch today's featured Daily Motivation video
router.get('/motivation/daily', (req, res) => {
  ensureMotivationInitialized();
  const videos = store.get('motivation_videos').filter((v) => v.status === 'active');

  if (videos.length === 0) {
    return res.status(404).json({ error: 'No active motivation videos found.' });
  }

  // 1. Check if an active video is explicitly marked as today's spotlight
  let dailyVideo = videos.find((v) => v.isSpotlight);

  // 2. If none marked or multiple, auto-rotate by day of year so daily changes automatically!
  if (!dailyVideo) {
    const dayIndex = getDayOfYear() % videos.length;
    dailyVideo = videos[dayIndex];
  }

  res.json({ video: dailyVideo });
});

// List all active motivation videos with filtering
router.get('/motivation', (req, res) => {
  ensureMotivationInitialized();
  const { category, search } = req.query;
  let list = store.get('motivation_videos').filter((v) => v.status === 'active');

  if (category && category !== 'All') {
    list = list.filter((v) => v.category?.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((v) =>
      v.title?.toLowerCase().includes(q) ||
      v.speaker?.toLowerCase().includes(q) ||
      v.quote?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q)
    );
  }

  // Sort by spotlight first, then newest
  list.sort((a, b) => {
    if (a.isSpotlight && !b.isSpotlight) return -1;
    if (!a.isSpotlight && b.isSpotlight) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  res.json({ videos: list });
});

// Student: Cheer/Inspire a motivation video
router.post('/motivation/:id/cheer', authenticate, (req, res) => {
  ensureMotivationInitialized();
  const video = store.getById('motivation_videos', req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });

  const updated = store.update('motivation_videos', req.params.id, {
    cheersCount: (video.cheersCount || 0) + 1
  });

  res.json({ success: true, cheersCount: updated.cheersCount });
});

// Student: Track view count
router.post('/motivation/:id/view', (req, res) => {
  ensureMotivationInitialized();
  const video = store.getById('motivation_videos', req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });

  const updated = store.update('motivation_videos', req.params.id, {
    viewsCount: (video.viewsCount || 0) + 1
  });

  res.json({ success: true, viewsCount: updated.viewsCount });
});

// Helper: Auto-fetch YouTube metadata via oEmbed
router.get('/motivation/fetch-meta', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required.' });

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid watch, shorts, or youtu.be link.' });
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    const thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

    let title = '';
    let speaker = '';

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        title = data.title || '';
        speaker = data.author_name || '';
      }
    } catch (e) {
      console.warn('oEmbed fetch warning:', e.message);
    }

    res.json({
      youtubeId,
      embedUrl,
      thumbnailUrl,
      title,
      speaker
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect YouTube URL: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// Admin CRUD Routes
// ---------------------------------------------------------------------------

// List all videos for admin
router.get('/admin/motivation', authenticate, requireRole('admin'), (req, res) => {
  ensureMotivationInitialized();
  const list = store.get('motivation_videos');
  list.sort((a, b) => {
    if (a.isSpotlight && !b.isSpotlight) return -1;
    if (!a.isSpotlight && b.isSpotlight) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  res.json({ videos: list });
});

// Create motivation video
router.post('/admin/motivation', authenticate, requireRole('admin'), (req, res) => {
  ensureMotivationInitialized();
  const {
    youtubeUrl,
    title,
    speaker,
    quote,
    category = 'Exam Focus & Struggle',
    tags = [],
    isSpotlight = false,
    status = 'active'
  } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ error: 'YouTube URL is required.' });
  }

  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) {
    return res.status(400).json({ error: 'Invalid YouTube URL format.' });
  }

  // If new video is marked as spotlight, reset other spotlights
  if (isSpotlight) {
    const all = store.get('motivation_videos');
    all.forEach((v) => {
      if (v.isSpotlight) {
        store.update('motivation_videos', v.id, { isSpotlight: false });
      }
    });
  }

  const newVideo = store.create('motivation_videos', {
    title: title || 'Motivational Video Spotlight',
    youtubeUrl: youtubeUrl.trim(),
    youtubeId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    speaker: speaker || 'Study Mentor',
    quote: quote || 'Keep moving forward — every small step counts toward your big dream!',
    category,
    tags: Array.isArray(tags) ? tags : [category],
    isSpotlight: Boolean(isSpotlight),
    status: status || 'active',
    cheersCount: 0,
    viewsCount: 0,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ video: newVideo });
});

// Update motivation video
router.put('/admin/motivation/:id', authenticate, requireRole('admin'), (req, res) => {
  ensureMotivationInitialized();
  const existing = store.getById('motivation_videos', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Video not found.' });

  const {
    youtubeUrl,
    title,
    speaker,
    quote,
    category,
    tags,
    isSpotlight,
    status
  } = req.body;

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (speaker !== undefined) updates.speaker = speaker;
  if (quote !== undefined) updates.quote = quote;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;

  if (youtubeUrl) {
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({ error: 'Invalid YouTube URL format.' });
    }
    updates.youtubeUrl = youtubeUrl.trim();
    updates.youtubeId = youtubeId;
    updates.embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    updates.thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  if (isSpotlight !== undefined) {
    updates.isSpotlight = Boolean(isSpotlight);
    if (updates.isSpotlight) {
      // Unset other spotlights
      const all = store.get('motivation_videos');
      all.forEach((v) => {
        if (v.id !== req.params.id && v.isSpotlight) {
          store.update('motivation_videos', v.id, { isSpotlight: false });
        }
      });
    }
  }

  const updated = store.update('motivation_videos', req.params.id, updates);
  res.json({ video: updated });
});

// Set active spotlight video
router.post('/admin/motivation/:id/spotlight', authenticate, requireRole('admin'), (req, res) => {
  ensureMotivationInitialized();
  const target = store.getById('motivation_videos', req.params.id);
  if (!target) return res.status(404).json({ error: 'Video not found.' });

  // Unset all other spotlights
  const all = store.get('motivation_videos');
  all.forEach((v) => {
    store.update('motivation_videos', v.id, { isSpotlight: v.id === req.params.id });
  });

  const updated = store.getById('motivation_videos', req.params.id);
  res.json({ success: true, video: updated });
});

// Delete motivation video
router.delete('/admin/motivation/:id', authenticate, requireRole('admin'), (req, res) => {
  ensureMotivationInitialized();
  const existing = store.getById('motivation_videos', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Video not found.' });

  store.delete('motivation_videos', req.params.id);
  res.json({ success: true, message: 'Video removed successfully.' });
});

export default router;
