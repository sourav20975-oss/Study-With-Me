import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  BookOpen,
  HelpCircle,
  Sparkles,
  CheckSquare,
  FileCheck,
  BarChart2,
  Newspaper,
  Settings,
  Flame,
  X
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Tutor Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/subjects', label: 'Syllabus & Chapters', icon: FolderTree },
  { to: '/admin/notes', label: 'Notes Editor', icon: FileText },
  { to: '/admin/pdfs', label: 'PDF Library & Books', icon: BookOpen, badge: '100MB' },
  { to: '/admin/questions', label: 'Question Bank', icon: HelpCircle },
  { to: '/admin/ai-question-generator', label: 'AI Generator', icon: Sparkles, badge: 'Multi-AI' },
  { to: '/admin/quizzes', label: 'Quizzes & Tests', icon: CheckSquare },
  { to: '/admin/assignments', label: 'Homework Grading', icon: FileCheck },
  { to: '/admin/doubts', label: 'Doubts Queue', icon: HelpCircle },
  { to: '/admin/motivation', label: 'Daily Motivation', icon: Flame, badge: 'Daily' },
  { to: '/admin/news', label: 'Science Feed', icon: Newspaper },
  { to: '/admin/settings', label: 'Settings & Status', icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)] lg:z-20 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-display font-extrabold text-sm">
              S
            </div>
            <span className="font-display font-extrabold text-sm text-slate-900">StudySathi Tutor</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Curriculum Workbench
          </div>

          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-orange-500" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-0.5">
          <span className="font-bold text-slate-800 block">Class 8 Personal Tuition</span>
          <span className="text-slate-500">Academic Editorial Workbench</span>
        </div>
      </aside>
    </>
  );
}
