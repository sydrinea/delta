interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="relative px-2 py-1 text-xs rounded bg-ctp-surface0 border-t-2 border-ctp-peach/65 text-ctp-text whitespace-nowrap">
          {label}
          <svg
            className="absolute top-full left-1/2 -translate-x-1/2 text-ctp-surface0"
            width="8"
            height="4"
            viewBox="0 0 8 4"
            fill="currentColor"
          >
            <path d="M0 0L4 4L8 0" />
          </svg>
        </div>
      </div>
    </div>
  );
}
