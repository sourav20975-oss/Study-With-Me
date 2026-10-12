import katex from 'katex';

/**
 * Converts user friendly notes text (Plain text, Markdown-style shortcuts, Diagrams, Images, and KaTeX math)
 * into semantic, beautifully formatted HTML without requiring the user to write raw HTML tags.
 */
export function parseNoteToHtml(rawText) {
  if (!rawText) return '';

  let text = String(rawText).trim();

  // 1. If the user already wrote full HTML tags (e.g. starts with <p> or <h3> or <div>),
  // we still parse images, diagrams, and math equations inside it and return.
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

  if (hasHtmlTags) {
    return renderKaTeX(renderImagesAndDiagrams(text));
  }

  // 2. Otherwise, convert Markdown / Plaintext structure to Rich HTML:
  // Normalize markdown elements so headings, lists, callouts, and images separate cleanly into blocks
  text = text.replace(/([^\n])\n(#{1,3}\s+)/g, '$1\n\n$2');
  text = text.replace(/^(#{1,3}\s+[^\n]+)\n([^\n#\s])/gm, '$1\n\n$2');
  text = text.replace(/([^\n])\n([-*]\s+)/g, '$1\n\n$2');
  text = text.replace(/([^\n])\n(!\[.*?\]\(.*?\))/g, '$1\n\n$2');
  text = text.replace(/(!\[.*?\]\(.*?\))\n([^\n])/g, '$1\n\n$2');
  // Split into paragraphs / blocks by double newlines
  const blocks = text.split(/\n\s*\n/);

  const parsedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';

    // A. Diagrams / Images: ![Caption](imageUrl)
    if (/^!\[(.*?)\]\((.*?)\)$/m.test(trimmed)) {
      return renderImageMarkdown(trimmed);
    }

    // B. Headings (# H1, ## H2, ### H3)
    if (/^###\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^###\s+(.+)$/gm,
        '<h4 class="font-display text-base sm:text-lg font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange-500 inline-block"></span><span>$1</span></h4>'
      );
    }
    if (/^##\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^##\s+(.+)$/gm,
        '<h3 class="font-display text-lg sm:text-xl font-extrabold text-slate-900 mt-7 mb-3 pb-1.5 border-b border-slate-200/80 flex items-center gap-2.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span><span>$1</span></h3>'
      );
    }
    if (/^#\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^#\s+(.+)$/gm,
        '<h2 class="font-display text-xl sm:text-2xl font-black text-orange-600 mt-8 mb-4 tracking-tight flex items-center gap-2.5"><span class="w-3 h-3 rounded-md bg-orange-500 inline-block shadow-xs"></span><span>$1</span></h2>'
      );
    }

    // C. Callouts / Exam Tips (> Tip: ...)
    if (trimmed.startsWith('>')) {
      const calloutContent = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ');
      return `<div class="p-4 sm:p-5 my-5 rounded-2xl bg-orange-50/90 border-l-4 border-orange-500 text-slate-800 text-sm sm:text-base leading-relaxed shadow-xs"><div class="font-extrabold text-orange-800 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span class="text-base">💡</span><span>High-Yield Exam Tip</span></div><div class="font-medium text-slate-800">${formatInlineText(calloutContent)}</div></div>`;
    }

    // D. Solved Example Box ([Example] or Example: ...)
    if (/^(Example|Solved Example|Q\.|Illustration)\s*:/i.test(trimmed)) {
      return `<div class="p-4 sm:p-5 my-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-slate-800 text-sm sm:text-base leading-relaxed shadow-xs"><div class="font-extrabold text-emerald-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><span class="text-base">📝</span><span>ICSE Worked Example</span></div><div class="font-medium text-slate-800 space-y-1">${formatInlineText(trimmed)}</div></div>`;
    }

    // E. Table (| col1 | col2 |)
    if (trimmed.includes('|') && trimmed.includes('\n')) {
      const rows = trimmed.split('\n').filter((r) => r.trim().startsWith('|'));
      if (rows.length >= 2) {
        return renderMarkdownTable(rows);
      }
    }

    // F. Unordered Bullet List (- or *)
    if (/^[-*]\s+/m.test(trimmed)) {
      const items = trimmed
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((line) => {
          const itemText = line.replace(/^[-*]\s+/, '').trim();
          return `<li class="ml-4 pl-1.5 mb-2 leading-relaxed text-slate-700">${formatInlineText(itemText)}</li>`;
        })
        .join('');
      return `<ul class="list-disc list-outside my-3.5 space-y-1 text-slate-700 text-sm sm:text-base leading-relaxed">${items}</ul>`;
    }

    // G. Numbered Ordered List (1. 2. 3.)
    if (/^\d+\.\s+/m.test(trimmed)) {
      const items = trimmed
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((line) => {
          const itemText = line.replace(/^\d+\.\s+/, '').trim();
          return `<li class="ml-4 pl-1.5 mb-2 leading-relaxed text-slate-700">${formatInlineText(itemText)}</li>`;
        })
        .join('');
      return `<ol class="list-decimal list-outside my-3.5 space-y-1 text-slate-700 text-sm sm:text-base leading-relaxed">${items}</ol>`;
    }

    // H. Regular Paragraph
    const lines = trimmed.split('\n').map((l) => formatInlineText(l)).join('<br/>');
    return `<p class="text-slate-700 text-sm sm:text-base leading-relaxed my-3 font-normal">${lines}</p>`;
  });

  const fullHtml = parsedBlocks.join('\n');
  return renderKaTeX(renderImagesAndDiagrams(fullHtml));
}

/**
 * Renders an educational diagram figure block from markdown image syntax
 */
function renderImageMarkdown(blockText) {
  return blockText.replace(/!\[(.*?)\]\((.*?)\)/g, (_, caption, url) => {
    const cleanUrl = url.trim();
    const cleanCaption = caption.trim() || 'Curriculum Diagram';
    return `<figure class="my-6 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
      <div class="overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100">
        <img src="${cleanUrl}" alt="${cleanCaption}" class="max-h-[420px] w-auto max-w-full rounded-lg object-contain hover:scale-[1.01] transition-transform duration-200" loading="lazy" />
      </div>
      <figcaption class="mt-3 text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[10px] uppercase tracking-wider border border-orange-200">FIGURE / DIAGRAM</span>
        <span>${cleanCaption}</span>
      </figcaption>
    </figure>`;
  });
}

function renderImagesAndDiagrams(html) {
  return html.replace(/!\[(.*?)\]\((.*?)\)/g, (_, caption, url) => {
    return renderImageMarkdown(`![${caption}](${url})`);
  });
}

/**
 * Render standard markdown table to clean styled HTML table
 */
function renderMarkdownTable(rows) {
  let tableHtml = '<div class="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs"><table class="w-full text-left text-xs sm:text-sm">';
  
  rows.forEach((row, idx) => {
    if (row.includes('---')) return; // separator row

    const cells = row
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => i > 0 && i < arr.length - 1);

    if (idx === 0) {
      tableHtml += '<thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-200"><tr>';
      cells.forEach((cell) => {
        tableHtml += `<th class="p-3.5 sm:px-4 sm:py-3">${formatInlineText(cell)}</th>`;
      });
      tableHtml += '</tr></thead><tbody class="divide-y divide-slate-100 bg-white">';
    } else {
      tableHtml += '<tr class="hover:bg-slate-50/60 transition-colors">';
      cells.forEach((cell) => {
        tableHtml += `<td class="p-3.5 sm:px-4 sm:py-3 text-slate-700 font-medium">${formatInlineText(cell)}</td>`;
      });
      tableHtml += '</tr>';
    }
  });

  tableHtml += '</tbody></table></div>';
  return tableHtml;
}

/**
 * Format inline elements like **bold**, *italic*, `code`, and inline math
 */
function formatInlineText(text) {
  let res = text;
  // Bold **text**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');
  // Italic *text*
  res = res.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');
  // Inline code `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-orange-600 font-mono text-xs border border-slate-200 font-semibold">$1</code>'
  );
  return res;
}

/**
 * Render KaTeX math formulas in both display ($$ ... $$, \[ ... \]) and inline (\( ... \))
 */
function renderKaTeX(htmlString) {
  let res = htmlString;

  // 1. Display Math \[ ... \] or $$ ... $$
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => renderDisplayMath(formula));
  res = res.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => renderDisplayMath(formula));

  // 2. Inline Math \( ... \)
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => renderInlineMath(formula));

  return res;
}

function renderDisplayMath(formula) {
  try {
    const rendered = katex.renderToString(formula.trim(), {
      displayMode: true,
      throwOnError: false
    });
    return `<div class="math-block my-4 p-4 rounded-2xl bg-orange-50/40 border border-orange-200 text-center overflow-x-auto shadow-2xs">${rendered}</div>`;
  } catch (e) {
    return `<div class="math-block text-rose-500 my-2">${formula}</div>`;
  }
}

function renderInlineMath(formula) {
  try {
    return katex.renderToString(formula.trim(), {
      displayMode: false,
      throwOnError: false
    });
  } catch (e) {
    return formula;
  }
}
