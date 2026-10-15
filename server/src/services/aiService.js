import { config } from '../config/env.js';

// Pre-crafted high-fidelity curriculum generation repository for ICSE Class 8
const CURRICULUM_BANK = {
  'Rational Numbers': [
    {
      prompt: 'What is the sum of \\( \\frac{-3}{5} \\) and \\( \\frac{2}{3} \\)?',
      type: 'single_select',
      options: ['\\( \\frac{1}{15} \\)', '\\( -\\frac{1}{15} \\)', '\\( \\frac{5}{8} \\)', '\\( -\\frac{5}{15} \\)'],
      correctAnswer: '0',
      explanation: 'LCM of 5 and 3 is 15. \\( \\frac{-3 \\times 3 + 2 \\times 5}{15} = \\frac{-9 + 10}{15} = \\frac{1}{15} \\).',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'If \\( x = \\frac{1}{2} \\) and \\( y = \\frac{3}{4} \\), verify whether \\( x - y = y - x \\). Is subtraction commutative for rational numbers?',
      type: 'single_select',
      options: ['Yes, always', 'No, subtraction is not commutative', 'Only for positive numbers', 'Cannot be determined'],
      correctAnswer: '1',
      explanation: '\\( x - y = \\frac{1}{2} - \\frac{3}{4} = -\\frac{1}{4} \\), whereas \\( y - x = \\frac{3}{4} - \\frac{1}{2} = \\frac{1}{4} \\). Since \\( -\\frac{1}{4} \\neq \\frac{1}{4} \\), subtraction is not commutative.',
      difficulty: 'medium',
      marks: 2
    },
    {
      prompt: 'Find the multiplicative inverse of \\( -13 \\times \\left(-\\frac{1}{13}\\right) \\).',
      type: 'numerical',
      options: [],
      correctAnswer: '1',
      explanation: 'First simplify: \\( -13 \\times \\left(-\\frac{1}{13}\\right) = 1 \\). The reciprocal of 1 is 1.',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'How many rational numbers exist between any two distinct rational numbers?',
      type: 'single_select',
      options: ['Only 1', 'Exactly 10', 'Infinitely many', 'None'],
      correctAnswer: '2',
      explanation: 'Between any two distinct rational numbers, there exist infinitely many rational numbers.',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'Is 0 a rational number?',
      type: 'true_false',
      options: ['True', 'False'],
      correctAnswer: '0',
      explanation: 'Yes, 0 can be written as \\( \\frac{0}{1} \\) where 0 and 1 are integers and denominator is not zero.',
      difficulty: 'easy',
      marks: 1
    }
  ],
  'Linear Equations in One Variable': [
    {
      prompt: 'Solve for \\( m \\): \\( 3m = 5m - \\frac{8}{5} \\). What is the value of \\( m \\)?',
      type: 'single_select',
      options: ['\\( \\frac{4}{5} \\)', '\\( \\frac{8}{5} \\)', '\\( -\\frac{4}{5} \\)', '2'],
      correctAnswer: '0',
      explanation: 'Transposing \\( 5m \\) to LHS: \\( 3m - 5m = -\\frac{8}{5} \\Rightarrow -2m = -\\frac{8}{5} \\Rightarrow m = \\frac{-8}{-2 \\times 5} = \\frac{4}{5} \\).',
      difficulty: 'medium',
      marks: 2
    },
    {
      prompt: 'Solve the equation \\( \\frac{x}{3} + 1 = \\frac{7}{15} \\). Find \\( x \\).',
      type: 'single_select',
      options: ['\\( -\\frac{8}{5} \\)', '\\( \\frac{8}{5} \\)', '\\( -\\frac{4}{5} \\)', '1'],
      correctAnswer: '0',
      explanation: '\\( \\frac{x}{3} = \\frac{7}{15} - 1 = \\frac{7 - 15}{15} = -\\frac{8}{15} \\). Multiply by 3: \\( x = -\\frac{8 \\times 3}{15} = -\\frac{8}{5} \\).',
      difficulty: 'medium',
      marks: 2
    },
    {
      prompt: 'The perimeter of a rectangle is 13 cm and its width is \\( 2\\frac{3}{4}\\text{ cm} \\). Find its length in cm.',
      type: 'single_select',
      options: ['\\( 3\\frac{3}{4}\\text{ cm} \\)', '\\( 4\\text{ cm} \\)', '\\( 2\\frac{1}{2}\\text{ cm} \\)', '\\( 5\\text{ cm} \\)'],
      correctAnswer: '0',
      explanation: 'Perimeter = \\( 2(\\text{length} + \\text{breadth}) = 13 \\Rightarrow \\text{length} + \\frac{11}{4} = \\frac{13}{2} \\Rightarrow \\text{length} = \\frac{26 - 11}{4} = \\frac{15}{4} = 3\\frac{3}{4}\\text{ cm} \\).',
      difficulty: 'hard',
      marks: 3
    },
    {
      prompt: 'If \\( 2x - 3 = 7 \\), then \\( x = 5 \\).',
      type: 'true_false',
      options: ['True', 'False'],
      correctAnswer: '0',
      explanation: '\\( 2x = 7 + 3 = 10 \\Rightarrow x = 5 \\). The statement is True.',
      difficulty: 'easy',
      marks: 1
    }
  ],
  'Crop Production and Management': [
    {
      prompt: 'Which organic matter is prepared by decomposition of plant and animal waste?',
      type: 'single_select',
      options: ['Manure', 'Fertilizer', 'Weedicide', 'Pesticide'],
      correctAnswer: '0',
      explanation: 'Manure is an organic substance obtained from the decomposition of plant or animal wastes by microorganisms.',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'Which modern irrigation technique delivers water drop by drop directly near plant roots?',
      type: 'single_select',
      options: ['Drip irrigation', 'Sprinkler system', 'Rahat system', 'Dhekli'],
      correctAnswer: '0',
      explanation: 'In drip irrigation, water falls drop by drop directly at the position of the roots, preventing water wastage.',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'Rhizobium bacteria present in the root nodules of leguminous plants help in:',
      type: 'single_select',
      options: ['Nitrogen fixation', 'Water absorption', 'Weed control', 'Seed dispersal'],
      correctAnswer: '0',
      explanation: 'Rhizobium fixes atmospheric nitrogen into usable nitrogenous compounds for leguminous plants.',
      difficulty: 'medium',
      marks: 2
    }
  ],
  'Force and Pressure': [
    {
      prompt: 'When two forces act on an object in opposite directions, the net force acting on the object is:',
      type: 'single_select',
      options: [
        'Difference between the two forces',
        'Sum of the two forces',
        'Product of the two forces',
        'Zero always'
      ],
      correctAnswer: '0',
      explanation: 'When forces act in opposite directions, the net force is equal to the difference between the two opposing forces in the direction of the larger force.',
      difficulty: 'easy',
      marks: 1
    },
    {
      prompt: 'Why are school bag shoulder straps made wide?',
      type: 'single_select',
      options: [
        'To reduce pressure on shoulders (as Pressure = Force / Area)',
        'To increase weight of the bag',
        'To increase pressure for better grip',
        'Purely for decorative style'
      ],
      correctAnswer: '0',
      explanation: 'A broader strap increases surface area (A). Since Pressure = Force / Area, increasing area lowers pressure on shoulders.',
      difficulty: 'medium',
      marks: 2
    },
    {
      prompt: 'Atmospheric pressure is measured in units of Pascals (N/m²).',
      type: 'true_false',
      options: ['True', 'False'],
      correctAnswer: '0',
      explanation: 'The SI unit of pressure is Pascal, which equals 1 Newton per square meter.',
      difficulty: 'easy',
      marks: 1
    }
  ]
};

function buildSystemPrompt({ subjectName, chapterTitle, grade, language, difficulty, reqCount, marks, includeExplanations, sourceContent }) {
  return `You are an expert ${grade} teacher creating academic assessment questions for ICSE curriculum.
Subject: ${subjectName}
Chapter: ${chapterTitle}
Language: ${language || 'English'}
Target Difficulty: ${difficulty || 'medium'}
Count: ${reqCount}
Marks per question: ${marks}
Include detailed worked step-by-step explanations: ${includeExplanations}
${sourceContent ? `Reference Source Text:\n${sourceContent.slice(0, 3000)}\n` : ''}

Generate exactly ${reqCount} questions. Format all mathematical expressions using LaTeX notation \\( ... \\) or \\[ ... \\].
Return ONLY valid JSON in this exact structure without markdown backticks:
{
  "questions": [
    {
      "prompt": "Question text here with LaTeX if applicable",
      "type": "single_select",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "0",
      "explanation": "Clear step-by-step worked explanation",
      "difficulty": "${difficulty === 'mixed' ? 'medium' : difficulty}",
      "marks": ${marks}
    }
  ]
}`;
}

// 1. Call Groq
async function callGroq(prompt) {
  if (!config.groqApiKey) return null;
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  let lastErr = null;

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groqApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        lastErr = new Error(`Groq status ${res.status}: ${await res.text()}`);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);
      return parsed.questions || [];
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('All Groq models failed.');
}

// 2. Call Gemini
async function callGemini(prompt) {
  if (!config.geminiApiKey) return null;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    })
  });
  if (!res.ok) throw new Error(`Gemini status ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(text);
  return parsed.questions || [];
}

// 3. Call OpenRouter
async function callOpenRouter(prompt) {
  if (!config.openrouterApiKey) return null;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouterApiKey}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  if (!res.ok) throw new Error(`OpenRouter status ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed.questions || [];
}

export async function generateQuestionsWithAI({
  provider = 'auto',
  subjectId,
  subjectName,
  chapterId,
  chapterTitle,
  grade = 'Class 8',
  sourceType = 'manual',
  sourceContent = '',
  count = 3,
  difficulty = 'mixed',
  questionType = 'all',
  language = 'English',
  marks = 2,
  includeExplanations = true
}) {
  const reqCount = Math.min(Math.max(parseInt(count) || 3, 1), 10);
  const prompt = buildSystemPrompt({
    subjectName,
    chapterTitle,
    grade,
    language,
    difficulty,
    reqCount,
    marks,
    includeExplanations,
    sourceContent
  });

  let questions = null;
  let usedProvider = 'curriculum_engine';

  // Try chosen or prioritized provider
  const providersToTry = [];
  if (provider === 'groq') providersToTry.push('groq', 'openrouter', 'gemini');
  else if (provider === 'gemini') providersToTry.push('gemini', 'groq', 'openrouter');
  else if (provider === 'openrouter') providersToTry.push('openrouter', 'groq', 'gemini');
  else providersToTry.push('groq', 'openrouter', 'gemini'); // Default auto priority: Groq is fastest

  for (const p of providersToTry) {
    try {
      if (p === 'groq' && config.groqApiKey) {
        questions = await callGroq(prompt);
        if (questions && questions.length > 0) {
          usedProvider = 'Groq (High-Speed Engine)';
          break;
        }
      } else if (p === 'openrouter' && config.openrouterApiKey) {
        questions = await callOpenRouter(prompt);
        if (questions && questions.length > 0) {
          usedProvider = 'OpenRouter';
          break;
        }
      } else if (p === 'gemini' && config.geminiApiKey) {
        questions = await callGemini(prompt);
        if (questions && questions.length > 0) {
          usedProvider = 'Google Gemini 2.0';
          break;
        }
      }
    } catch (err) {
      console.warn(`⚠️ AI call to ${p} failed, attempting next fallback:`, err.message);
    }
  }

  // If live AI returned questions, format them
  if (questions && questions.length > 0) {
    return questions.map((q, idx) => ({
      ...q,
      subjectId,
      chapterId,
      sourceType: 'ai',
      aiProvider: usedProvider,
      reviewStatus: 'needs_review',
      id: `ai-gen-${Date.now()}-${idx}`
    }));
  }

  // Fallback to high-quality ICSE curriculum bank
  const bankMatches = CURRICULUM_BANK[chapterTitle] || CURRICULUM_BANK['Rational Numbers'];
  const generated = [];

  for (let i = 0; i < reqCount; i++) {
    const template = bankMatches[i % bankMatches.length];
    const itemDifficulty = difficulty === 'mixed' ? template.difficulty : difficulty;

    generated.push({
      id: `ai-gen-${Date.now()}-${i}`,
      subjectId,
      chapterId,
      type: questionType === 'all' ? template.type : (questionType === 'numerical' ? 'numerical' : (questionType === 'true_false' ? 'true_false' : 'single_select')),
      prompt: template.prompt,
      options: template.options || [],
      correctAnswer: template.correctAnswer,
      explanation: includeExplanations ? template.explanation : '',
      difficulty: itemDifficulty,
      marks: parseInt(marks) || template.marks || 1,
      negativeMarks: 0,
      sourceType: sourceType === 'notes' ? 'notes' : 'ai',
      aiProvider: 'ICSE Curriculum Engine',
      reviewStatus: 'needs_review',
      createdAt: new Date().toISOString()
    });
  }

  return generated;
}

// -----------------------------------------------------------------------------
// Science Feed Article Generation
// -----------------------------------------------------------------------------

const SCIENCE_CATEGORIES = [
  'Space & Astronomy',
  'Environment & Agriculture',
  'Physics & Machines',
  'Biology & Nature',
  'Chemistry & Earth',
  'ICSE Discoveries'
];

function selectScienceCoverImage(topic = '', category = '') {
  const t = topic.toLowerCase();
  const c = category.toLowerCase();

  if (
    t.includes('periodic') || t.includes('chem') || t.includes('atom') ||
    t.includes('element') || t.includes('acid') || t.includes('base') ||
    t.includes('reaction') || t.includes('metal') || t.includes('matter') ||
    c.includes('chem')
  ) {
    const images = [
      'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop'
    ];
    return {
      category: 'Chemistry & Earth',
      image: images[Math.floor(Math.random() * images.length)]
    };
  }

  if (
    t.includes('bio') || t.includes('cell') || t.includes('micro') ||
    t.includes('plant') || t.includes('animal') || t.includes('dna') ||
    t.includes('tissue') || t.includes('organ') || t.includes('ecosystem') ||
    c.includes('bio')
  ) {
    const images = [
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1200&auto=format&fit=crop'
    ];
    return {
      category: 'Biology & Nature',
      image: images[Math.floor(Math.random() * images.length)]
    };
  }

  if (
    t.includes('crop') || t.includes('soil') || t.includes('farm') ||
    t.includes('pollut') || t.includes('climat') || t.includes('environment') ||
    c.includes('agri') || c.includes('environ')
  ) {
    const images = [
      'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?q=80&w=1200&auto=format&fit=crop'
    ];
    return {
      category: 'Environment & Agriculture',
      image: images[Math.floor(Math.random() * images.length)]
    };
  }

  if (
    t.includes('physic') || t.includes('light') || t.includes('force') ||
    t.includes('sound') || t.includes('electric') || t.includes('magnet') ||
    t.includes('energy') || t.includes('pressure') || t.includes('machine') ||
    c.includes('physic')
  ) {
    const images = [
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop'
    ];
    return {
      category: 'Physics & Machines',
      image: images[Math.floor(Math.random() * images.length)]
    };
  }

  // Default Space & Astronomy
  const spaceImages = [
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop'
  ];
  return {
    category: 'Space & Astronomy',
    image: spaceImages[Math.floor(Math.random() * spaceImages.length)]
  };
}

function parseArticleJSON(raw) {
  let cleaned = (raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Repair unescaped newlines in JSON strings
    let inString = false;
    let repaired = '';
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '"' && cleaned[i - 1] !== '\\') {
        inString = !inString;
        repaired += char;
      } else if (inString && (char === '\n' || char === '\r')) {
        repaired += char === '\n' ? '\\n' : '';
      } else if (inString && char === '\t') {
        repaired += '\\t';
      } else {
        repaired += char;
      }
    }

    try {
      return JSON.parse(repaired);
    } catch (err2) {
      // Regex field extractor fallback
      const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/i);
      const categoryMatch = cleaned.match(/"category"\s*:\s*"([^"]+)"/i);
      const descMatch = cleaned.match(/"description"\s*:\s*"([^"]+)"/i);
      const readTimeMatch = cleaned.match(/"readTimeMinutes"\s*:\s*(\d+)/i);

      let content = '';
      const contentIdx = cleaned.indexOf('"content"');
      if (contentIdx !== -1) {
        const colonIdx = cleaned.indexOf(':', contentIdx);
        const quoteStart = cleaned.indexOf('"', colonIdx + 1);
        if (quoteStart !== -1) {
          const readTimeIdx = cleaned.indexOf('"readTimeMinutes"', quoteStart);
          const tagsIdx = cleaned.indexOf('"tags"', quoteStart);
          let endIdx = cleaned.length - 1;
          if (readTimeIdx !== -1) endIdx = Math.min(endIdx, readTimeIdx);
          if (tagsIdx !== -1) endIdx = Math.min(endIdx, tagsIdx);

          let rawContent = cleaned.substring(quoteStart + 1, endIdx);
          rawContent = rawContent.replace(/",\s*$/, '').replace(/"$/, '').trim();
          content = rawContent.replace(/\\n/g, '\n');
        }
      }

      if (titleMatch || content) {
        return {
          title: titleMatch ? titleMatch[1] : null,
          category: categoryMatch ? categoryMatch[1] : null,
          description: descMatch ? descMatch[1] : null,
          content: content || null,
          readTimeMinutes: readTimeMatch ? parseInt(readTimeMatch[1]) : 4
        };
      }
      throw err;
    }
  }
}

export async function generateScienceArticleWithAI({ topic = 'Space Science Exploration', category = 'Space & Astronomy' }) {
  const meta = selectScienceCoverImage(topic, category);
  const targetCategory = SCIENCE_CATEGORIES.includes(category) && category !== 'All' ? category : meta.category;

  const prompt = `You are a distinguished science educator and curriculum specialist writing for ICSE Class 8 students.
The user wants an educational science article based on this topic prompt: "${topic}".
User suggested category: "${targetCategory}".

INSTRUCTIONS:
1. Correct any typos or misspellings in the user's prompt (e.g. "prodic table chemisrty" -> "The Periodic Table of Elements & Chemistry").
2. Assign the single most appropriate category from this exact list:
   - "Chemistry & Earth"
   - "Physics & Machines"
   - "Biology & Nature"
   - "Space & Astronomy"
   - "Environment & Agriculture"
   - "ICSE Discoveries"
3. Create an engaging, scientifically accurate, and age-appropriate ICSE Class 8 article.
4. Output MUST BE strictly valid JSON without markdown code fences. Inside the JSON, any newlines in the "content" field MUST be escaped as \\n.

JSON structure:
{
  "title": "Clear, engaging title (e.g. 'Unlocking the Periodic Table: The Building Blocks of Matter')",
  "category": "Exact category from the list above",
  "description": "Engaging 2-sentence summary hook explaining what students will learn.",
  "content": "Full markdown text of the article with \\n for line breaks. Must include:\\n### 1. Introduction\\n### 2. Historical Discovery & Core Principle\\n### 3. Key Concepts, Formulas & Scientific Notation\\n### 4. Real-World Applications & Daily Life Examples\\n### 5. ICSE Class 8 Exam Spotlight (Key takeaways for exams)\\n### 6. Mind-Blowing Science Fact",
  "readTimeMinutes": 4,
  "source": "Tutor AI Science Lab",
  "tags": ["Science", "ICSE Class 8"]
}`;

  let raw = '';

  // 1. Try OpenRouter (meta-llama/llama-3.3-70b-instruct)
  if (config.openrouterApiKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openrouterApiKey}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });
      if (res.ok) {
        const data = await res.json();
        raw = data.choices?.[0]?.message?.content || '';
      }
    } catch (err) {
      console.warn('⚠️ OpenRouter article generation failed:', err.message);
    }
  }

  // 2. Try Groq (openai/gpt-oss-120b or qwen/qwen3.8-27b)
  if (!raw && config.groqApiKey) {
    for (const model of ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.groqApiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
          })
        });
        if (res.ok) {
          const data = await res.json();
          raw = data.choices?.[0]?.message?.content || '';
          if (raw) break;
        }
      } catch (err) {
        console.warn(`⚠️ Groq model ${model} article generation failed:`, err.message);
      }
    }
  }

  // If live AI produced output, parse it
  if (raw) {
    try {
      const parsed = parseArticleJSON(raw);
      if (parsed && parsed.title && parsed.content) {
        const finalCategory = SCIENCE_CATEGORIES.includes(parsed.category) ? parsed.category : targetCategory;
        return {
          title: parsed.title,
          category: finalCategory,
          description: parsed.description || `Exploring fundamental science concepts behind ${parsed.title}.`,
          content: parsed.content,
          image: meta.image,
          source: 'Tutor AI Science Lab (ICSE)',
          readTimeMinutes: parsed.readTimeMinutes || 4,
          status: 'draft'
        };
      }
    } catch (err) {
      console.warn('⚠️ Failed to parse AI article JSON, using intelligent fallback:', err.message);
    }
  }

  // 3. Fallback: Topic-aware ICSE curriculum article
  const t = topic.toLowerCase();
  let fallbackTitle = `${topic} — ICSE Class 8 Science Spotlight`;
  let fallbackContent = '';
  let fallbackCategory = targetCategory;

  if (t.includes('periodic') || t.includes('chem') || t.includes('atom') || t.includes('element')) {
    fallbackCategory = 'Chemistry & Earth';
    fallbackTitle = 'The Periodic Table & Chemistry: Decoding the Building Blocks of Matter';
    fallbackContent = `### 1. Introduction to Elements & Matter
Everything around us — the air we breathe ($O_2$), water ($H_2O$), and common salt ($NaCl$) — is composed of basic chemical elements. The Modern Periodic Table arranges all 118 known elements in order of increasing atomic number ($Z$).

### 2. Historical Discovery: Dmitri Mendeleev's Vision
In 1869, Russian chemist Dmitri Mendeleev discovered that when elements are arranged by atomic properties, a recurring periodic pattern emerges. He famously left blank spaces in his table for undiscovered elements like Gallium and Germanium, accurately predicting their chemical behaviors before they were found!

### 3. Anatomy of the Periodic Table
* **Periods (Horizontal Rows):** There are 7 periods. Across a period, atomic radius decreases as nuclear pull increases.
* **Groups (Vertical Columns):** There are 18 groups. Elements in the same group possess the same number of valence electrons, giving them matching chemical reactivity.

### 4. Key Groups for ICSE Class 8:
1. **Group 1 (Alkali Metals):** Sodium ($Na$), Potassium ($K$) — highly reactive, soft metals stored under kerosene oil.
2. **Group 2 (Alkaline Earth Metals):** Magnesium ($Mg$), Calcium ($Ca$) — essential for bones, teeth, and cellular energy.
3. **Group 17 (Halogens):** Chlorine ($Cl_2$), Bromine ($Br_2$), Iodine ($I_2$) — reactive non-metals used in disinfectants and salts.
4. **Group 18 (Noble Gases):** Helium ($He$), Neon ($Ne$), Argon ($Ar$) — inert gases with full octets in their outermost energy shells.

### 5. ICSE Exam Spotlight & Key Formulas:
* **Atomic Number ($Z$):** Number of protons = Number of electrons in a neutral atom.
* **Mass Number ($A$):** Number of protons + Number of neutrons ($A = Z + N$).
* **Valency:** Combining capacity of an element determined by outermost electrons.

### 6. Mind-Blowing Science Fact:
Did you know that Helium was discovered on the Sun during a solar eclipse in 1868 — almost 30 years before scientists successfully isolated it on Earth? That's why it is named after *Helios*, the ancient Greek god of the Sun!`;
  } else if (t.includes('light') || t.includes('sound') || t.includes('physic') || t.includes('force')) {
    fallbackCategory = 'Physics & Machines';
    fallbackTitle = `${topic}: Fundamental Forces & Principles in Action`;
    fallbackContent = `### 1. Core Physical Principle
Understanding how ${topic} governs energy transfer, motion, and everyday technology.

### 2. Historical & Experimental Foundations
From Sir Isaac Newton's laws of motion and optics to modern electromagnetic applications.

### 3. Key ICSE Class 8 Formulas & Units:
* **Force:** $F = m \\times a$ (measured in Newtons, $N$).
* **Pressure:** $P = \\frac{F}{A}$ (measured in Pascals, $Pa$).
* **Work & Energy:** $W = F \\times s$ (measured in Joules, $J$).

### 4. Real-world Significance:
Modern high-speed transit, electric vehicles, and renewable power systems utilize these exact physics relationships daily!`;
  } else {
    fallbackContent = `### 1. Overview of ${topic}
Exploring the cutting-edge science and ICSE Class 8 curriculum connections of ${topic}.

### 2. Key Scientific Principles
1. **Underlying Mechanisms:** How molecules, forces, and biological systems interact.
2. **Experimental Evidence:** Key observations and laboratory findings.
3. **Daily Life Applications:** How this concept improves medicine, energy, and global sustainability.

### 3. Did You Know?
Scientific research in this field continues to unlock new technologies for Indian and global space, medical, and environmental frontiers!`;
  }

  return {
    title: fallbackTitle,
    category: fallbackCategory,
    description: `A deep dive into ${fallbackTitle} — connecting fundamental scientific principles directly to ICSE Class 8 syllabus concepts.`,
    content: fallbackContent,
    image: meta.image,
    source: 'Tutor AI Science Lab (ICSE)',
    readTimeMinutes: 4,
    status: 'draft'
  };
}

