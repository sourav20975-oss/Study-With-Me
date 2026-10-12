import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, CheckSquare, HelpCircle, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/app/quizzes', label: 'Quizzes', icon: CheckSquare },
  { to: '/app/doubts', label: 'Doubts', icon: HelpCircle },
  { to: '/app/more', label: 'More', icon: MoreHorizontal }
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border lg:hidden shadow-sm">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-olive font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded transition-colors ${isActive ? 'bg-olive-soft' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
