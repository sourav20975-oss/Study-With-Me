import express from 'express';
import { store } from '../db/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generateQuestionsWithAI, generateScienceArticleWithAI } from '../services/aiService.js';

const router = express.Router();

// Seed initial default science articles if empty
const DEFAULT_SCIENCE_ARTICLES = [
  {
    id: 'art-space-1',
    title: 'ISRO Chandrayaan & Space Science Explorations',
    category: 'Space & Astronomy',
    description: 'How Indian scientists explore lunar craters, solar winds with Aditya-L1, and future deep-space missions.',
    content: `### Exploring the Cosmos with ISRO
India's space program has made historic breakthroughs that directly connect to our Class 8 physics and celestial studies.

#### 1. Why Study the Moon's South Pole?
The South Pole contains permanently shadowed craters where temperatures drop below $-200^\\circ\\text{C}$. In these cold traps, water ice remains preserved from billions of years ago.

#### 2. Key Science Takeaways for Class 8:
* **Gravity on Moon:** The Moon's gravitational acceleration is roughly $\\frac{1}{6}$th of Earth's gravity ($g_{\\text{moon}} \\approx 1.62\\text{ m/s}^2$).
* **Absence of Atmosphere:** Sound waves cannot propagate on the Moon because sound requires a material medium to travel.
* **Solar Power in Space:** Rovers use solar panels because there is no cloud cover to block solar radiation during lunar daytime.`,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    source: 'Tutor Science Special',
    readTimeMinutes: 3,
    status: 'published',
    likesCount: 14,
    createdAt: '2025-01-15T08:00:00.000Z'
  },
  {
    id: 'art-bio-1',
    title: 'Modern Drip Irrigation & Micro-Sensors in Agriculture',
    category: 'Environment & Agriculture',
    description: 'Agricultural scientists invent automated moisture sensors to save up to 60% irrigation water in Indian farms.',
    content: `### Smart Irrigation in ICSE Class 8
In Chapter 1 (Crop Production and Management), we study traditional vs modern methods of irrigation.

#### Drip Irrigation (Trickle Method):
Water falls drop by drop directly near the roots of the plants through narrow pipes and emitters.

#### Why is it the most water-efficient method?
1. **Zero Evaporation Loss:** Water goes directly to the root zone instead of standing in open fields.
2. **Weed Prevention:** Unwanted weeds between rows don't get water to grow.
3. **Ideal for Water-Deficit Regions:** Highly recommended for regions with fruit gardens, orchards, and limited groundwater.`,
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop',
    source: 'ICSE Ecology Desk',
    readTimeMinutes: 4,
    status: 'published',
    likesCount: 9,
    createdAt: '2025-01-16T10:30:00.000Z'
  },
  {
    id: 'art-phys-1',
    title: 'The Science of Friction: Why Roller Bearings Prevent Energy Loss',
    category: 'Physics & Machines',
    description: 'Investigating how rolling friction is significantly less than sliding friction in machines, bicycles, and skateboards.',
    content: `### Friction: A Necessary Evil
In our physics syllabus, we learn that while friction causes wear and tear in machine parts, it is also essential for walking and holding objects.

#### Rolling vs Sliding Friction:
When an object rolls across a surface, the area of contact is minimal at any instant. Therefore:
$$\\text{Rolling Friction} < \\text{Sliding Friction} < \\text{Static Friction}$$

#### Practical Application:
In ceiling fans and bicycle hubs, ball bearings replace sliding motion with rolling motion, dramatically reducing heat and mechanical friction!`,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    source: 'Class 8 Physics Lab',
    readTimeMinutes: 3,
    status: 'published',
    likesCount: 18,
    createdAt: '2025-01-17T12:00:00.000Z'
  }
];

function ensureArticlesInitialized() {
  const existing = store.get('articles');
  if (!existing || existing.length === 0) {
    DEFAULT_SCIENCE_ARTICLES.forEach((art) => store.create('articles', art));
  }
}

// Get Science Articles (Student gets published only, Admin gets all)
router.get('/news', (req, res) => {
  ensureArticlesInitialized();
  let articles = store.get('articles') || [];
  const { category, search, role } = req.query;

  // If role is student or not specified as admin, return ONLY published articles
  if (role !== 'admin') {
    articles = articles.filter((a) => a.status === 'published');
  }

  if (category && category !== 'all') {
    articles = articles.filter((a) => a.category?.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const s = search.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        (a.description && a.description.toLowerCase().includes(s)) ||
        (a.category && a.category.toLowerCase().includes(s))
    );
  }

  // Sort latest first
  articles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ articles });
});

// Admin: Create Science Article
router.post('/admin/news', authenticate, requireRole('admin'), (req, res) => {
  ensureArticlesInitialized();
  const { title, category, description, content, image, source, status, readTimeMinutes } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const newArticle = store.create('articles', {
    title: title.trim(),
    category: category || 'Science & Tech',
    description: description.trim(),
    content: content || description,
    image: image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    source: source || 'Tutor Desk',
    readTimeMinutes: parseInt(readTimeMinutes) || 3,
    status: status || 'published',
    likesCount: 0,
    createdBy: req.user.id
  });

  res.status(201).json({ article: newArticle });
});

// Admin: Update Science Article
router.patch('/admin/news/:id', authenticate, requireRole('admin'), (req, res) => {
  ensureArticlesInitialized();
  const existing = store.getById('articles', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found.' });

  const updated = store.update('articles', req.params.id, req.body);
  res.json({ article: updated });
});

// Admin: Delete Science Article
router.delete('/admin/news/:id', authenticate, requireRole('admin'), (req, res) => {
  ensureArticlesInitialized();
  const existing = store.getById('articles', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found.' });

  store.delete('articles', req.params.id);
  res.json({ success: true, message: 'Article removed successfully.' });
});

// Admin: Toggle Publish Status
router.post('/admin/news/:id/toggle-publish', authenticate, requireRole('admin'), (req, res) => {
  ensureArticlesInitialized();
  const existing = store.getById('articles', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found.' });

  const nextStatus = existing.status === 'published' ? 'draft' : 'published';
  const updated = store.update('articles', req.params.id, { status: nextStatus });
  res.json({ article: updated });
});

// Admin: AI Generate Science Article Draft
router.post('/admin/news/ai-generate', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { topic = 'Space Science Exploration', category = 'Space & Astronomy' } = req.body;
    const article = await generateScienceArticleWithAI({ topic, category });
    res.json({ article });
  } catch (err) {
    console.error('Failed to generate AI article:', err);
    res.status(500).json({ error: 'Failed to generate article: ' + err.message });
  }
});

// Student: Like an article
router.post('/news/:id/like', authenticate, (req, res) => {
  ensureArticlesInitialized();
  const existing = store.getById('articles', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found.' });

  const updated = store.update('articles', req.params.id, {
    likesCount: (existing.likesCount || 0) + 1
  });

  res.json({ success: true, likesCount: updated.likesCount });
});

export default router;
