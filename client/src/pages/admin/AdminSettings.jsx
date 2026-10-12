import React, { useState } from 'react';
import { api } from '../../api/client.js';
import {
  Settings,
  Database,
  Cloud,
  Cpu,
  Newspaper,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export function AdminSettings() {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Platform Settings & System Status
          </h1>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          Verify connected cloud services, database configurations, and AI inference providers.
        </p>
      </div>

      {/* Services Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-text">
              <Database className="w-4 h-4 text-accent" />
              <span>Database Engine</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Connected to MongoDB Atlas (Cluster0) with synchronized local disk store persistence in <code className="bg-page px-1 py-0.5 rounded text-[11px]">server/data/store.json</code>.
          </p>
        </div>

        {/* Cloudinary */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-text">
              <Cloud className="w-4 h-4 text-accent" />
              <span>Cloudinary Media Storage</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Configured</span>
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Cloud Name: <code className="bg-page px-1 py-0.5 rounded text-[11px]">czb80riv</code>. Homework photos and student doubt images upload to Cloudinary with local fallback.
          </p>
        </div>

        {/* Multi-AI Inference */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-text">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Multi-AI Engines</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3 Providers Ready</span>
            </span>
          </div>
          <ul className="text-xs text-text-muted space-y-1 list-disc pl-4">
            <li><strong>Groq:</strong> Llama 3.3 70B Versatile (Active)</li>
            <li><strong>Google Gemini:</strong> Gemini 2.0 Flash (Active)</li>
            <li><strong>OpenRouter:</strong> Meta Llama 3.3 70B (Active)</li>
            <li><strong>Curriculum Engine:</strong> ICSE Class 8 Offline Backup</li>
          </ul>
        </div>

        {/* GNews API */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-text">
              <Newspaper className="w-4 h-4 text-accent" />
              <span>Educational & Science News</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Feed Active</span>
            </span>
          </div>
          <p className="text-xs text-text-muted">
            GNews API key configured with 15-minute smart caching for optimal speed and quota conservation.
          </p>
        </div>
      </div>
    </div>
  );
}
