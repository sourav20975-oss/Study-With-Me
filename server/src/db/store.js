import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';
import { getSeedData } from './seedData.js';
import mongoose from 'mongoose';

const ALL_COLLECTIONS = [
  'users',
  'subjects',
  'chapters',
  'notes',
  'questions',
  'quizzes',
  'assignments',
  'submissions',
  'doubts',
  'studyTasks',
  'quizAttempts',
  'bookmarks',
  'notifications',
  'news',
  'articles',
  'documents',
  'motivation_videos'
];

class Store {
  constructor() {
    this.filePath = path.join(config.dataDir, 'store.json');
    this.data = null;
    this.isInitialized = false;
    this.mongoConnected = false;
    this.lastDiskMtime = null;
  }

  async init() {
    if (this.isInitialized) return;

    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    // Step 1: Load initial local disk cache / seed data
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        this.lastDiskMtime = fs.statSync(this.filePath).mtimeMs;
        console.log('📂 Loaded local store cache from disk.');
      } catch (err) {
        console.warn('⚠️ Could not parse store.json, generating fresh seed...', err.message);
        this.data = await getSeedData();
        this.save();
      }
    } else {
      console.log('🌱 Generating fresh StudySathi seed data...');
      this.data = await getSeedData();
      this.save();
    }

    // Ensure all standard collections exist as arrays
    for (const col of ALL_COLLECTIONS) {
      if (!Array.isArray(this.data[col])) {
        this.data[col] = [];
      }
    }

    // Step 2: Connect to MongoDB Atlas and synchronize
    if (config.mongodbUri) {
      try {
        console.log('🍃 Connecting to MongoDB Atlas...');
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 8000
        });
        this.mongoConnected = true;
        console.log('✅ Connected successfully to MongoDB Atlas!');

        const db = mongoose.connection.db;
        const existingCollections = await db.listCollections().toArray();
        const existingNames = existingCollections.map((c) => c.name);

        const hasUsersCollection = existingNames.includes('users');
        const userCount = hasUsersCollection ? await db.collection('users').countDocuments() : 0;

        if (userCount > 0) {
          // MongoDB Atlas has persistent data: Pull into memory & disk cache
          console.log('📥 Loading persistent state from MongoDB Atlas into active store...');
          for (const colName of ALL_COLLECTIONS) {
            if (existingNames.includes(colName)) {
              const docs = await db.collection(colName).find({}).toArray();
              this.data[colName] = docs.map((doc) => {
                const { _id, ...rest } = doc;
                return { id: rest.id || _id, ...rest };
              });
            } else if (!this.data[colName]) {
              this.data[colName] = [];
            }
          }
          this.save();
          console.log('✨ All collections synchronized from MongoDB Atlas successfully!');
        } else {
          // MongoDB Atlas is fresh/empty: Migrate seed/store.json to MongoDB Atlas
          console.log('🌱 MongoDB Atlas is empty. Migrating dataset to MongoDB Atlas collections...');
          for (const colName of ALL_COLLECTIONS) {
            const items = this.data[colName] || [];
            if (items.length > 0) {
              const docs = items.map((item) => ({
                _id: String(item.id || `${colName}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
                ...item
              }));
              await db.collection(colName).insertMany(docs);
            }
          }
          console.log('✅ Successfully migrated initial collections to MongoDB Atlas!');
        }
      } catch (err) {
        console.warn('⚠️ MongoDB Atlas sync notice (operating from disk store):', err.message);
      }
    }

    this.isInitialized = true;
  }

  save() {
    try {
      const tempPath = this.filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
      this.lastDiskMtime = fs.statSync(this.filePath).mtimeMs;
    } catch (err) {
      console.error('❌ Error saving store to disk:', err);
    }
  }

  get(collection) {
    if (fs.existsSync(this.filePath)) {
      try {
        const stats = fs.statSync(this.filePath);
        if (!this.data || !this.lastDiskMtime || stats.mtimeMs > this.lastDiskMtime) {
          const raw = fs.readFileSync(this.filePath, 'utf-8');
          this.data = JSON.parse(raw);
          this.lastDiskMtime = stats.mtimeMs;
        }
      } catch (e) {}
    }
    return (this.data && this.data[collection]) || [];
  }

  getById(collection, id) {
    const list = this.get(collection);
    return list.find((item) => item.id === id) || null;
  }

  find(collection, predicate) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  findOne(collection, predicate) {
    const list = this.get(collection);
    return list.find(predicate) || null;
  }

  create(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const newItem = {
      ...item,
      id: item.id || `${collection.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.data[collection].push(newItem);
    this.save();

    // Asynchronously persist to MongoDB Atlas
    if (this.mongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db
        .collection(collection)
        .replaceOne({ _id: newItem.id }, { _id: newItem.id, ...newItem }, { upsert: true })
        .catch((err) => console.error(`❌ MongoDB create failed for ${collection}:`, err.message));
    }

    return newItem;
  }

  update(collection, id, updates) {
    const list = this.get(collection);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const updated = this.data[collection][index];
    this.save();

    // Asynchronously persist to MongoDB Atlas
    if (this.mongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db
        .collection(collection)
        .replaceOne({ _id: id }, { _id: id, ...updated }, { upsert: true })
        .catch((err) => console.error(`❌ MongoDB update failed for ${collection}:`, err.message));
    }

    return updated;
  }

  delete(collection, id) {
    const list = this.get(collection);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this.save();

    // Asynchronously persist to MongoDB Atlas
    if (this.mongoConnected && mongoose.connection.readyState === 1) {
      mongoose.connection.db
        .collection(collection)
        .deleteOne({ _id: id })
        .catch((err) => console.error(`❌ MongoDB delete failed for ${collection}:`, err.message));
    }

    return true;
  }

  async resetSeed() {
    this.data = await getSeedData();
    this.save();

    if (this.mongoConnected && mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      for (const colName of ALL_COLLECTIONS) {
        await db.collection(colName).deleteMany({}).catch(() => {});
        const items = this.data[colName] || [];
        if (items.length > 0) {
          const docs = items.map((item) => ({
            _id: String(item.id || `${colName}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
            ...item
          }));
          await db.collection(colName).insertMany(docs).catch(() => {});
        }
      }
    }

    return this.data;
  }
}

export const store = new Store();
