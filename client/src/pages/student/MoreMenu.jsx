import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileCheck,
  RotateCcw,
  Bookmark,
  BarChart2,
  Newspaper,
  Bell,
  ArrowRightLeft,
  LogOut,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Flame
} from 'lucide-react';

export function MoreMenu() {
  const { user, switchDemoRole, logout } = useAuth();

  const MENU_SECTIONS = [
    {
      title: 'Learning & Practice',
      links: [
        { to: '/app/pdfs', label: 'PDF Books & Guides', icon: BookOpen, desc: 'Class 8 textbooks, science guides & papers' },
        { to: '/app/homework', label: 'Homework & Worksheets', icon: FileCheck, desc: 'Submit and view teacher grades' },
        { to: '/app/revision', label: 'Mistake Notebook & Saved', icon: RotateCcw, desc: 'Focus on missed test questions' },
        { to: '/app/bookmarks', label: 'Bookmarked Notes', icon: Bookmark, desc: 'Your saved study chapters' },
        { to: '/app/progress', label: 'My Academic Progress', icon: BarChart2, desc: 'Chapter accuracy & trends' }
      ]
    },
    {
      title: 'Exploration & Updates',
      links: [
        { to: '/app/motivation', label: 'Daily Motivation Videos', icon: Flame, desc: 'Daily inspirational talks, Khan Sir & top mentors' },
        { to: '/app/news', label: 'Science & Education News', icon: Newspaper, desc: 'Curated articles & ICSE breakthroughs' },
        { to: '/app/notifications', label: 'Notifications', icon: Bell, desc: 'Doubt answers and feedback' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-surface p-4 rounded-lg border border-border shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center text-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-text">{user?.name || 'Aarav Sharma'}</h3>
            <span className="text-xs text-text-muted">Class 8 Student · StudySathi</span>
          </div>
        </div>

        <button
          onClick={() => switchDemoRole('admin')}
          className="text-xs px-2.5 py-1 rounded border border-border bg-page hover:bg-surface-muted text-accent font-semibold flex items-center gap-1"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Tutor Mode</span>
        </button>
      </div>

      {/* Nav List Sections */}
      {MENU_SECTIONS.map((sec, idx) => (
        <div key={idx} className="space-y-2">
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-1">
            {sec.title}
          </h4>
          <div className="bg-surface rounded-lg border border-border divide-y divide-border overflow-hidden">
            {sec.links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="p-3.5 flex items-center justify-between hover:bg-surface-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-accent" />
                    <div>
                      <div className="text-sm font-medium text-text group-hover:text-accent">
                        {link.label}
                      </div>
                      <div className="text-[11px] text-text-muted">{link.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full p-3 rounded-lg border border-danger/20 bg-danger/5 hover:bg-danger/10 text-danger text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of StudySathi</span>
      </button>
    </div>
  );
}
