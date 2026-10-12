import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';
import { getSeedData } from './seedData.js';

import mongoose from 'mongoose';

class Store {
  constructor() {
    this.filePath = path.join(config.dataDir, 'store.json');
    this.data = null;
    this.isInitialized = false;
    this.mongoConnected = false;
  }

  async init() {
    if (this.isInitialized) return;

    if (config.mongodbUri) {
      try {
        console.log('🍃 Connecting to MongoDB Atlas...');
        await mongoose.connect(config.mongodbUri, {
          serverSelectionTimeoutMS: 5000
        });
        this.mongoConnected = true;
        console.log('✅ Connected successfully to MongoDB Atlas!');
      } catch (err) {
        console.warn('⚠️ MongoDB Atlas connection notice (will use persistent disk store):', err.message);
      }
    }

    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('📂 Loaded existing database store from disk.');
      } catch (err) {
        console.warn('⚠️ Could not parse store.json, re-seeding...', err.message);
        this.data = await getSeedData();
        this.save();
      }
    } else {
      console.log('🌱 Seeding fresh StudySathi database with Class 8 curriculum...');
      this.data = await getSeedData();
      this.save();
    }

    this.isInitialized = true;
  }

  save() {
    try {
      const tempPath = this.filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('❌ Error saving store to disk:', err);
    }
  }

  get(collection) {
    return this.data[collection] || [];
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
    this.save();
    return this.data[collection][index];
  }

  delete(collection, id) {
    const list = this.get(collection);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this.save();
    return true;
  }

  async resetSeed() {
    this.data = await getSeedData();
    this.save();
    return this.data;
  }
}

export const store = new Store();
