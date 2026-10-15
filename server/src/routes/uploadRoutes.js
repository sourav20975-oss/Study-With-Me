import express from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { uploadToCloudinary } from '../services/storage/cloudinaryService.js';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file type rejected.' });
  }

  const localUrl = `/uploads/${req.file.filename}`;
  const isPdf =
    req.file.mimetype === 'application/pdf' ||
    req.file.originalname?.toLowerCase().endsWith('.pdf');

  try {
    // Attempt Cloudinary upload first
    const cloudResult = await uploadToCloudinary(req.file.path, 'studysathi/uploads');

    if (cloudResult && cloudResult.url) {
      // For PDFs, verify that Cloudinary account allows public delivery
      // (Cloudinary blocks PDFs by default with 401 ACL failure unless toggled on in Cloudinary console)
      if (isPdf) {
        try {
          const testRes = await fetch(cloudResult.url, { method: 'HEAD' });
          if (testRes.status === 401 || testRes.status === 403) {
            console.warn(
              '⚠️ Cloudinary denied public delivery of PDF (401 ACL failure). Using local server storage instead.'
            );
            return res.json({
              url: localUrl,
              provider: 'local',
              filename: req.file.filename,
              originalName: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size
            });
          }
        } catch (e) {
          // If check fails, safe fallback
        }
      }

      return res.json({
        url: cloudResult.url,
        provider: 'cloudinary',
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: cloudResult.bytes || req.file.size
      });
    }

    // Fallback: local file URL
    res.json({
      url: localUrl,
      provider: 'local',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error('Upload processing error:', err);
    // Graceful fallback to local file so upload never fails for the user
    res.json({
      url: localUrl,
      provider: 'local',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  }
});

export default router;
