import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'studysathi-super-secret-key-calm-editorial-2025',
  jwtExpiresIn: '7d',
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb+srv://sourav20975_db_user:fm8AZV7PZ3wqNB5t@cluster0.uhm0m1o.mongodb.net/studysathi?retryWrites=true&w=majority',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataDir: path.join(__dirname, '../../data'),
  uploadDir: path.join(__dirname, '../../data/uploads'),

  // AI Providers
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',

  // News API
  gnewsApiKey: process.env.GNEWS_API_KEY || '',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryUrl: process.env.CLOUDINARY_URL || ''
};
