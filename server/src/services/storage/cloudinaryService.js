import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import { config } from '../../config/env.js';

if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
    secure: true
  });
} else if (config.cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: config.cloudinaryUrl,
    secure: true
  });
}

export async function uploadToCloudinary(filePath, folder = 'studysathi') {
  if (!config.cloudinaryCloudName && !config.cloudinaryUrl) {
    // Cloudinary credentials not supplied, skip and use local
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto'
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (err) {
    console.warn('⚠️ Cloudinary upload attempt failed, falling back to local storage:', err.message);
    return null;
  }
}
