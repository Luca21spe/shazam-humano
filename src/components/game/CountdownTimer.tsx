'use client';

interface CountdownTimerProps {
  timeLeft: number;
  totalTime: number;
  label: string;
}

export default function CountdownTimer({
  timeLeft,
  totalTime,
  label,
}: CountdownTimerProps) {
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    progress > 0.3
      ? 'text-secondary stroke-secondary'
      : progress > 0.1
        ? 'text-yellow-400 stroke-yellow-400'
        : 'text-accent stroke-accent';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-surface-light"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-200`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-3xl font-bold ${color.split(' ')[0]} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}
          >
            {timeLeft}
          </span>
        </div>
      </div>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}
