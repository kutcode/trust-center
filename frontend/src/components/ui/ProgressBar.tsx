'use client';

interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  label?: string;
}

export default function ProgressBar({
  value = 0,
  max = 100,
  indeterminate = false,
  label,
}: ProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));

  return (
    <div className="w-full" role="status" aria-live="polite">
      {label && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {indeterminate ? (
          <div className="h-full w-1/3 bg-blue-600 rounded-full animate-pulse" />
        ) : (
          <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${safePercent}%` }} />
        )}
      </div>
    </div>
  );
}
