import katex from 'katex';

/**
 * Converts user friendly notes text (Plain text, Markdown-style shortcuts, Diagrams, Images, Tables, and KaTeX math)
 * into semantic, beautifully formatted HTML without requiring the user to write raw HTML tags.
 */
export function parseNoteToHtml(rawText) {
  if (!rawText) return '';

  let text = String(rawText).trim();

  // 1. If text contains raw HTML <table>...</table> blocks (e.g. copied from Wikipedia or web articles),
  // transform them into beautifully styled responsive tables.
  if (/<table[\s\S]*?<\/table>/i.test(text)) {
    text = styleHtmlTables(text);
  }

  // 2. Normalize markdown elements so headings, lists, callouts, images, and tables separate cleanly into blocks
  text = text.replace(/([^\n])\n(#{1,3}\s+)/g, '$1\n\n$2');
  text = text.replace(/^(#{1,3}\s+[^\n]+)\n([^\n#\s])/gm, '$1\n\n$2');
  text = text.replace(/([^\n])\n([-*]\s+)/g, '$1\n\n$2');
  text = text.replace(/([^\n])\n(!\[.*?\]\(.*?\))/g, '$1\n\n$2');
  text = text.replace(/(!\[.*?\]\(.*?\))\n([^\n])/g, '$1\n\n$2');

  // Separate markdown pipe tables if stuck to regular text
  text = text.replace(/([^\n|])\n(\|.+?\|)/g, '$1\n\n$2');
  text = text.replace(/(\|.+?\|)\n([^\n|])/g, '$1\n\n$2');

  // Split into paragraphs / blocks by double newlines
  const blocks = text.split(/\n\s*\n/);

  const parsedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';

    // A. Diagrams / Images: ![Caption](imageUrl)
    if (/^!\[(.*?)\]\((.*?)\)$/m.test(trimmed)) {
      return renderImageMarkdown(trimmed);
    }

    // B. Pre-styled HTML table wrapper or raw table block
    if (trimmed.includes('<div class="my-6 overflow-x-auto') || /^<table[\s\S]*?<\/table>$/i.test(trimmed)) {
      return trimmed;
    }

    // C. Tab-Separated Table (TSV) - Copied directly from web articles/Wikipedia/Excel
    if (isTabSeparatedTable(trimmed)) {
      return renderTabTable(trimmed);
    }

    // D. Markdown Pipe Table (| col1 | col2 | or col1 | col2)
    if (isPipeTable(trimmed)) {
      return renderPipeTable(trimmed);
    }

    // E. Headings (# H1, ## H2, ### H3)
    if (/^###\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^###\s+(.+)$/gm,
        (_, hText) =>
          `<h4 class="font-display text-base sm:text-lg font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange-500 inline-block"></span><span>${formatInlineText(hText)}</span></h4>`
      );
    }
    if (/^##\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^##\s+(.+)$/gm,
        (_, hText) =>
          `<h3 class="font-display text-lg sm:text-xl font-extrabold text-slate-900 mt-7 mb-3 pb-1.5 border-b border-slate-200/80 flex items-center gap-2.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span><span>${formatInlineText(hText)}</span></h3>`
      );
    }
    if (/^#\s+(.+)$/m.test(trimmed)) {
      return trimmed.replace(
        /^#\s+(.+)$/gm,
        (_, hText) =>
          `<h2 class="font-display text-xl sm:text-2xl font-black text-orange-600 mt-8 mb-4 tracking-tight flex items-center gap-2.5"><span class="w-3 h-3 rounded-md bg-orange-500 inline-block shadow-xs"></span><span>${formatInlineText(hText)}</span></h2>`
      );
    }

    // F. Callouts / Exam Tips (> Tip: ...)
    if (trimmed.startsWith('>')) {
      const calloutContent = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ');
      return `<div class="p-4 sm:p-5 my-5 rounded-2xl bg-orange-50/90 border-l-4 border-orange-500 text-slate-800 text-sm sm:text-base leading-relaxed shadow-xs"><div class="font-extrabold text-orange-800 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span class="text-base">💡</span><span>High-Yield Exam Tip</span></div><div class="font-medium text-slate-800">${formatInlineText(calloutContent)}</div></div>`;
    }

    // G. Solved Example Box ([Example] or Example: ...)
    if (/^(Example|Solved Example|Q\.|Illustration)\s*:/i.test(trimmed)) {
      return `<div class="p-4 sm:p-5 my-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-slate-800 text-sm sm:text-base leading-relaxed shadow-xs"><div class="font-extrabold text-emerald-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><span class="text-base">📝</span><span>ICSE Worked Example</span></div><div class="font-medium text-slate-800 space-y-1">${formatInlineText(trimmed)}</div></div>`;
    }

    // H. Unordered Bullet List (- or *)
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

    // I. Numbered Ordered List (1. 2. 3.)
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

    // J. Regular Paragraph
    const formattedParagraph = formatInlineText(trimmed).replace(/\n/g, '<br/>');
    return `<p class="text-slate-700 text-sm sm:text-base leading-relaxed my-3 font-normal">${formattedParagraph}</p>`;
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
 * Checks if a block of text represents a markdown pipe table
 */
export function isPipeTable(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter((l) => l.includes('|'));
  return pipeLines.length >= 2;
}

/**
 * Render standard markdown table to clean styled HTML table
 */
export function renderPipeTable(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let headerRow = null;
  let alignments = [];
  const dataRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if separator line e.g. |:---|:---:|---:| or | --- | --- |
    const isSeparator =
      /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(line) ||
      /^[-:| ]{3,}$/.test(line);

    if (isSeparator) {
      let sepCells = line.split('|');
      if (line.startsWith('|')) sepCells.shift();
      if (line.endsWith('|')) sepCells.pop();
      alignments = sepCells.map((c) => {
        const trimmed = c.trim();
        const left = trimmed.startsWith(':');
        const right = trimmed.endsWith(':');
        if (left && right) return 'text-center';
        if (right) return 'text-right';
        return 'text-left';
      });
      continue;
    }

    let rawCells = line.split('|');
    if (line.startsWith('|')) rawCells.shift();
    if (line.endsWith('|')) rawCells.pop();
    const cells = rawCells.map((c) => c.trim());

    if (!headerRow) {
      headerRow = cells;
    } else {
      dataRows.push(cells);
    }
  }

  if (!headerRow) return text;

  let tableHtml =
    '<div class="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs"><table class="w-full text-left text-xs sm:text-sm">';
  tableHtml +=
    '<thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-200"><tr>';

  headerRow.forEach((cell, idx) => {
    const alignClass = alignments[idx] || 'text-left';
    tableHtml += `<th class="p-3.5 sm:px-4 sm:py-3 font-bold text-slate-800 ${alignClass}">${formatInlineText(
      cell
    )}</th>`;
  });
  tableHtml += '</tr></thead><tbody class="divide-y divide-slate-100 bg-white">';

  dataRows.forEach((row) => {
    tableHtml += '<tr class="hover:bg-slate-50/60 transition-colors">';
    row.forEach((cell, idx) => {
      const alignClass = alignments[idx] || 'text-left';
      tableHtml += `<td class="p-3.5 sm:px-4 sm:py-3 text-slate-700 font-medium ${alignClass}">${formatInlineText(
        cell
      )}</td>`;
    });
    tableHtml += '</tr>';
  });

  tableHtml += '</tbody></table></div>';
  return tableHtml;
}

/**
 * Detects if a text block contains tab-separated lines (e.g. copied from Wikipedia/articles)
 */
export function isTabSeparatedTable(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const tabLines = lines.filter((l) => l.includes('\t'));
  return tabLines.length >= 2;
}

/**
 * Render tab-separated text (TSV) directly as a beautiful styled HTML table
 */
export function renderTabTable(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let tableHtml =
    '<div class="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs"><table class="w-full text-left text-xs sm:text-sm">';

  lines.forEach((line, idx) => {
    const cells = line.split('\t').map((c) => c.trim());
    if (idx === 0) {
      tableHtml +=
        '<thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-200"><tr>';
      cells.forEach((cell) => {
        tableHtml += `<th class="p-3.5 sm:px-4 sm:py-3 font-bold text-slate-800">${formatInlineText(
          cell
        )}</th>`;
      });
      tableHtml += '</tr></thead><tbody class="divide-y divide-slate-100 bg-white">';
    } else {
      tableHtml += '<tr class="hover:bg-slate-50/60 transition-colors">';
      cells.forEach((cell) => {
        tableHtml += `<td class="p-3.5 sm:px-4 sm:py-3 text-slate-700 font-medium">${formatInlineText(
          cell
        )}</td>`;
      });
      tableHtml += '</tr>';
    }
  });

  tableHtml += '</tbody></table></div>';
  return tableHtml;
}

/**
 * Converts raw HTML tables into modern styled responsive tables
 */
export function styleHtmlTables(html) {
  return html.replace(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi, (_, attrs, inner) => {
    let styledInner = inner;
    styledInner = styledInner.replace(
      /<thead\b([^>]*)>/gi,
      '<thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-200"$1>'
    );
    styledInner = styledInner.replace(
      /<th\b([^>]*)>([\s\S]*?)<\/th>/gi,
      (_, thAttrs, thContent) => {
        return `<th class="p-3.5 sm:px-4 sm:py-3 font-bold text-slate-800"${thAttrs}>${formatInlineText(
          thContent
        )}</th>`;
      }
    );
    styledInner = styledInner.replace(
      /<tbody\b([^>]*)>/gi,
      '<tbody class="divide-y divide-slate-100 bg-white"$1>'
    );
    styledInner = styledInner.replace(
      /<tr\b([^>]*)>/gi,
      '<tr class="hover:bg-slate-50/60 transition-colors"$1>'
    );
    styledInner = styledInner.replace(
      /<td\b([^>]*)>([\s\S]*?)<\/td>/gi,
      (_, tdAttrs, tdContent) => {
        return `<td class="p-3.5 sm:px-4 sm:py-3 text-slate-700 font-medium"${tdAttrs}>${formatInlineText(
          tdContent
        )}</td>`;
      }
    );

    return `<div class="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs"><table class="w-full text-left text-xs sm:text-sm"${attrs}>${styledInner}</table></div>`;
  });
}

/**
 * Format inline elements like **bold**, __bold__, *italic*, `code`, <sub>, <sup> and protects math
 */
export function formatInlineText(text) {
  if (!text) return '';
  let res = String(text);

  // 1. Temporarily protect math formulas so underscores / asterisks inside math aren't turned into bold/italic
  const mathTokens = [];
  res = res.replace(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?!\$)[^$\n]+(?<!\$)\$)/g,
    (m) => {
      const token = `%%MATHTOKEN${mathTokens.length}%%`;
      mathTokens.push(m);
      return token;
    }
  );

  // 2. HTML <b> and existing <strong> tags: normalize to standard styled strong
  res = res.replace(/<b\b([^>]*)>([\s\S]*?)<\/b>/gi, '<strong class="font-extrabold text-slate-900"$1>$2</strong>');
  res = res.replace(/<strong\b(?![^>]*class=)([^>]*)>([\s\S]*?)<\/strong>/gi, '<strong class="font-extrabold text-slate-900"$1>$2</strong>');

  // 3. Bold: **text** and __text__
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');
  res = res.replace(/__(.+?)__/g, '<strong class="font-extrabold text-slate-900">$1</strong>');

  // 4. Subscripts and superscripts: <sub> and <sup> (crucial for Science / Chemistry / Math!)
  res = res.replace(
    /<sub\b([^>]*)>([\s\S]*?)<\/sub>/gi,
    '<sub class="text-[0.75em] align-sub font-semibold text-slate-700"$1>$2</sub>'
  );
  res = res.replace(
    /<sup\b([^>]*)>([\s\S]*?)<\/sup>/gi,
    '<sup class="text-[0.75em] align-super font-semibold text-slate-700"$1>$2</sup>'
  );

  // 5. HTML <i> and existing <em> tags
  res = res.replace(/<i\b([^>]*)>([\s\S]*?)<\/i>/gi, '<em class="italic text-slate-800"$1>$2</em>');
  res = res.replace(/<em\b(?![^>]*class=)([^>]*)>([\s\S]*?)<\/em>/gi, '<em class="italic text-slate-800"$1>$2</em>');

  // 6. Italic: *text* and _text_ (when not part of bold or math)
  res = res.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em class="italic text-slate-800">$1</em>');
  res = res.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em class="italic text-slate-800">$1</em>');

  // 7. Inline code `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-orange-600 font-mono text-xs border border-slate-200 font-semibold">$1</code>'
  );

  // 8. Restore protected math formulas
  res = res.replace(/%%MATHTOKEN(\d+)%%/g, (_, idx) => mathTokens[Number(idx)] || '');

  return res;
}

/**
 * Render KaTeX math formulas in display ($$ ... $$, \[ ... \]) and inline (\( ... \), $ ... $)
 */
function renderKaTeX(htmlString) {
  let res = htmlString;

  // 1. Display Math \[ ... \] or $$ ... $$
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => renderDisplayMath(formula));
  res = res.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => renderDisplayMath(formula));

  // 2. Inline Math \( ... \)
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => renderInlineMath(formula));

  // 3. Single dollar inline Math $ ... $ (e.g. $E = mc^2$, $x = 5$)
  // Exclude plain dollar prices like $50 or $100.
  res = res.replace(/(?<!\$)\$(?!\$)([^\n\r$]+?)(?<!\$)\$(?!\$)/g, (fullMatch, formula) => {
    if (/^\s*\d+(\.\d+)?(\s*(million|billion|k))?\s*$/i.test(formula)) {
      return fullMatch;
    }
    return renderInlineMath(formula);
  });

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

/**
 * Utility: Converts an HTML table string into a clean Markdown table with bold formatting preserved
 */
export function convertHtmlTableToMarkdown(htmlString) {
  if (!htmlString) return null;
  const tableMatch = htmlString.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return null;

  const tableContent = tableMatch[0];
  const rowMatches = tableContent.match(/<tr[\s\S]*?<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) return null;

  const rows = [];
  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<(th|td)[\s\S]*?<\/\1>/gi);
    if (!cellMatches) continue;
    const cells = cellMatches.map((cellHtml) => {
      let text = cellHtml
        .replace(/^<(th|td)[^>]*>/i, '')
        .replace(/<\/(th|td)>$/i, '');
      // Preserve bold tags as markdown **text**
      text = text.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
      // Preserve italic tags as markdown *text*
      text = text.replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
      // Strip other non-sub/sup HTML tags
      text = text.replace(/<(?!sub|sup|\/sub|\/sup)[^>]+>/gi, '');
      // Unescape HTML entities
      text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"');
      return text.trim();
    });
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return null;
  const maxCols = Math.max(...rows.map((r) => r.length));
  if (maxCols < 1) return null;

  const formatRow = (cells) => {
    const padded = [...cells];
    while (padded.length < maxCols) padded.push('-');
    return '| ' + padded.map((c) => c || '-').join(' | ') + ' |';
  };

  const header = rows[0];
  const separator = new Array(maxCols).fill('---');
  const bodyRows = rows.slice(1);

  const lines = [
    formatRow(header),
    '| ' + separator.join(' | ') + ' |',
    ...bodyRows.map(formatRow)
  ];

  return lines.join('\n');
}

/**
 * Utility: Converts a tab-separated values (TSV) table into a clean Markdown table
 */
export function convertTsvToMarkdown(tsvText) {
  if (!tsvText) return null;
  const lines = tsvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const rows = lines.map((line) => line.split('\t').map((c) => c.trim()));
  const maxCols = Math.max(...rows.map((r) => r.length));
  if (maxCols < 2) return null;

  const formatRow = (cells) => {
    const padded = [...cells];
    while (padded.length < maxCols) padded.push('-');
    return '| ' + padded.map((c) => c || '-').join(' | ') + ' |';
  };

  const header = rows[0];
  const separator = new Array(maxCols).fill('---');
  const bodyRows = rows.slice(1);

  const mdLines = [
    formatRow(header),
    '| ' + separator.join(' | ') + ' |',
    ...bodyRows.map(formatRow)
  ];

  return mdLines.join('\n');
}
