import React, { useMemo } from 'react';
import { parseNoteToHtml } from '../../utils/noteParser.js';

export function MathRenderer({ content, className = '' }) {
  if (!content) return null;

  const html = useMemo(() => {
    return parseNoteToHtml(content);
  }, [content]);

  return (
    <div
      className={`math-rendered-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

