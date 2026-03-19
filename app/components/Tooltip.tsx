import { createPortal } from "react-dom";
import { useRef, useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos &&
        createPortal(
          <div
            className="fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ top: pos.top - 8, left: pos.left }}
          >
            <div className="relative px-2 py-1 text-xs rounded bg-ctp-surface0 border-t-2 border-ctp-mauve/65 text-ctp-text whitespace-nowrap">
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
          </div>,
          document.body,
        )}
    </div>
  );
}
