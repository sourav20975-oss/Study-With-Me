import express from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { uploadToCloudinary } from '../services/storage/cloudinaryService.js';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file type rejected.' });
  }

  try {
    // Attempt Cloudinary upload first
    const cloudResult = await uploadToCloudinary(req.file.path, 'studysathi/uploads');

    if (cloudResult && cloudResult.url) {
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
    const localUrl = `/uploads/${req.file.filename}`;
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
    res.status(500).json({ error: 'File upload processing failed.' });
  }
});

export default router;
