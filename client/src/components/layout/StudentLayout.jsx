import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { TopHeader } from '../common/TopHeader.jsx';
import { BottomNav } from '../common/BottomNav.jsx';
import {
  BookOpen,
  CheckSquare,
  HelpCircle,
  FileCheck,
  RotateCcw,
  BarChart2,
  Bookmark,
  Newspaper,
  Home,
  Sparkles
} from 'lucide-react';

const DESKTOP_NAV = [
  { to: '/app', label: 'Study Room', icon: Home, color: 'text-orange-500', end: true },
  { to: '/app/subjects', label: 'Syllabus & Notes', icon: BookOpen, color: 'text-emerald-600' },
  { to: '/app/quizzes', label: 'Practice Tests', icon: CheckSquare, color: 'text-amber-500' },
  { to: '/app/homework', label: 'Homework Desk', icon: FileCheck, color: 'text-rose-500' },
  { to: '/app/doubts', label: 'Ask Tutor Doubts', icon: HelpCircle, color: 'text-teal-600' },
  { to: '/app/news', label: 'Science Feed 🚀', icon: Newspaper, color: 'text-sky-600' },
  { to: '/app/revision', label: 'Mistake Notebook', icon: RotateCcw, color: 'text-purple-600' },
  { to: '/app/progress', label: 'Progress & Mastery', icon: BarChart2, color: 'text-emerald-600' },
  { to: '/app/bookmarks', label: 'Saved Chapters', icon: Bookmark, color: 'text-amber-600' },
];

export function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] w-full">
      <TopHeader />

      <div className="flex-1 w-full flex">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-slate-200 p-5 space-y-1.5 shrink-0 bg-white sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 mb-1">
            Study Companion
          </div>
          {DESKTOP_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 shadow-xs border border-orange-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : item.color}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </aside>

        {/* Full-Width Fluid Main Content */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 xl:p-10 pb-safe lg:pb-12 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
