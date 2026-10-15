import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { store } from '../db/store.js';
import { config } from '../config/env.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Format bytes to readable size string (e.g. 14.5 MB)
 */
function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return 'Unknown Size';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * GET /api/documents
 * Fetch all documents with populated subject & chapter metadata
 * Filterable by subjectId, chapterId, category, search query
 */
router.get('/documents', (req, res) => {
  const { subjectId, chapterId, category, search, role } = req.query;
  let documents = store.get('documents') || [];

  // Students only see published PDFs
  if (role === 'student') {
    documents = documents.filter((d) => d.isPublished !== false);
  }

  if (subjectId && subjectId !== 'all') {
    documents = documents.filter((d) => d.subjectId === subjectId);
  }

  if (chapterId && chapterId !== 'all') {
    documents = documents.filter((d) => d.chapterId === chapterId);
  }

  if (category && category !== 'all') {
    documents = documents.filter((d) => d.category?.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    documents = documents.filter((d) =>
      d.title?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q)
    );
  }

  const subjects = store.get('subjects') || [];
  const chapters = store.get('chapters') || [];

  const populated = documents.map((doc) => {
    const sub = subjects.find((s) => s.id === doc.subjectId);
    const chap = chapters.find((c) => c.id === doc.chapterId);
    return {
      ...doc,
      subjectName: sub ? sub.name : 'General Curriculum',
      chapterTitle: chap ? chap.title : 'General Study Material',
      fileSizeFormatted: doc.fileSizeFormatted || formatFileSize(doc.fileSize)
    };
  });

  // Sort newest first
  populated.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ documents: populated });
});

/**
 * GET /api/documents/:id
 * Retrieve a single document and record a read/view
 */
router.get('/documents/:id', (req, res) => {
  const doc = store.getById('documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'PDF Document not found.' });
  }

  // Increment view count
  const updatedViewCount = (doc.viewCount || 0) + 1;
  store.update('documents', doc.id, { viewCount: updatedViewCount });

  const subject = store.getById('subjects', doc.subjectId);
  const chapter = store.getById('chapters', doc.chapterId);

  res.json({
    document: {
      ...doc,
      viewCount: updatedViewCount,
      subjectName: subject ? subject.name : 'General Curriculum',
      chapterTitle: chapter ? chapter.title : 'General Study Material',
      fileSizeFormatted: doc.fileSizeFormatted || formatFileSize(doc.fileSize)
    }
  });
});

/**
 * POST /api/documents
 * Admin creates a new PDF document record
 */
router.post('/documents', authenticate, requireRole('admin'), (req, res) => {
  const {
    title,
    description,
    subjectId,
    chapterId,
    category,
    fileUrl,
    fileName,
    fileSize,
    pageCount,
    tags,
    isPublished
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Document Title is required.' });
  }
  if (!fileUrl) {
    return res.status(400).json({ error: 'File URL is required. Please upload a PDF file.' });
  }
  if (!subjectId) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  const newDoc = store.create('documents', {
    title: title.trim(),
    description: (description || '').trim(),
    subjectId,
    chapterId: chapterId || '',
    category: category || 'Textbook',
    fileUrl,
    fileName: fileName || 'document.pdf',
    fileSize: Number(fileSize) || 0,
    fileSizeFormatted: formatFileSize(fileSize),
    pageCount: Number(pageCount) || null,
    tags: Array.isArray(tags) ? tags : [],
    isPublished: isPublished !== false,
    uploadedBy: req.user.id,
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date().toISOString()
  });

  const subject = store.getById('subjects', newDoc.subjectId);
  const chapter = store.getById('chapters', newDoc.chapterId);

  res.status(201).json({
    document: {
      ...newDoc,
      subjectName: subject ? subject.name : 'General Curriculum',
      chapterTitle: chapter ? chapter.title : 'General Study Material'
    }
  });
});

/**
 * PUT /api/documents/:id
 * Admin updates PDF document metadata
 */
router.put('/documents/:id', authenticate, requireRole('admin'), (req, res) => {
  const doc = store.getById('documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const {
    title,
    description,
    subjectId,
    chapterId,
    category,
    fileUrl,
    fileName,
    fileSize,
    pageCount,
    tags,
    isPublished
  } = req.body;

  const updates = {
    updatedAt: new Date().toISOString()
  };

  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (subjectId !== undefined) updates.subjectId = subjectId;
  if (chapterId !== undefined) updates.chapterId = chapterId;
  if (category !== undefined) updates.category = category;
  if (fileUrl !== undefined) updates.fileUrl = fileUrl;
  if (fileName !== undefined) updates.fileName = fileName;
  if (fileSize !== undefined) {
    updates.fileSize = Number(fileSize);
    updates.fileSizeFormatted = formatFileSize(fileSize);
  }
  if (pageCount !== undefined) updates.pageCount = Number(pageCount);
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
  if (isPublished !== undefined) updates.isPublished = Boolean(isPublished);

  const updatedDoc = store.update('documents', req.params.id, updates);
  res.json({ document: updatedDoc });
});

/**
 * DELETE /api/documents/:id
 * Admin deletes a PDF document record
 */
router.delete('/documents/:id', authenticate, requireRole('admin'), (req, res) => {
  const doc = store.getById('documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // If local file, delete from disk
  if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
    try {
      const localPath = path.join(config.uploadDir, path.basename(doc.fileUrl));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (e) {
      console.warn('Could not delete local file on disk:', e.message);
    }
  }

  store.delete('documents', req.params.id);
  res.json({ success: true, message: 'PDF document removed successfully.' });
});

/**
 * POST /api/documents/:id/download
 * Increment download counter for analytics
 */
router.post('/documents/:id/download', (req, res) => {
  const doc = store.getById('documents', req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const updatedCount = (doc.downloadCount || 0) + 1;
  store.update('documents', doc.id, { downloadCount: updatedCount });

  res.json({ success: true, downloadCount: updatedCount });
});

export default router;
