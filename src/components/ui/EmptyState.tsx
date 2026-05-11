import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-bold text-white/60 mb-2">{title}</h3>
      <p className="text-sm text-white/30 mb-6 max-w-xs leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
