import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  CheckCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const BADGE_CONFIG = {
  draft: {
    label: 'Draft',
    icon: FileText,
    classes: 'bg-surface-muted text-ink-muted border-border'
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    classes: 'bg-forest-soft text-forest border-forest/30 font-medium'
  },
  needs_review: {
    label: 'Needs Review',
    icon: AlertCircle,
    classes: 'bg-amber-soft text-amber border-amber/30 font-medium'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-surface-muted text-ink-muted border-border'
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    classes: 'bg-olive-soft text-olive border-olive/30 font-medium'
  },
  answered: {
    label: 'Answered',
    icon: CheckCheck,
    classes: 'bg-forest-soft text-forest border-forest/30 font-medium'
  },
  submitted: {
    label: 'Submitted',
    icon: CheckCircle2,
    classes: 'bg-olive-soft text-olive border-olive/30 font-medium'
  },
  reviewed: {
    label: 'Reviewed',
    icon: CheckCheck,
    classes: 'bg-forest-soft text-forest border-forest/30 font-medium'
  },
  needs_revision: {
    label: 'Needs Revision',
    icon: RotateCcw,
    classes: 'bg-rust-soft text-rust border-rust/30 font-medium'
  },
  ai_draft: {
    label: 'AI Draft — Review Required',
    icon: Sparkles,
    classes: 'bg-amber-soft text-amber border-amber/30 font-semibold'
  }
};

export function StatusBadge({ status, labelOverride, size = 'sm' }) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');
  const cfg = BADGE_CONFIG[normalized] || {
    label: status || 'Unknown',
    icon: HelpCircle,
    classes: 'bg-surface-muted text-ink-muted border-border'
  };

  const Icon = cfg.icon;
  const displayText = labelOverride || cfg.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs tracking-tight ${cfg.classes} ${
        size === 'xs' ? 'text-[11px] px-2 py-0.2' : ''
      }`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{displayText}</span>
    </span>
  );
}
