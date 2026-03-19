import { createPortal } from "react-dom";
import { useRef, useState } from "react";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    align: "center" | "right";
  } | null>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const center = rect.left + rect.width / 2;
    const tooltipWidth = label.length * 7 + 16; // rough estimate
    const wouldOverhang = center + tooltipWidth / 2 > window.innerWidth - 8;

    setPos({
      top: rect.top,
      left: wouldOverhang ? rect.right : center,
      align: wouldOverhang ? "right" : "center",
    });
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
            className="fixed z-50 pointer-events-none"
            style={{
              top: pos.top - 8,
              left: pos.left,
              transform:
                pos.align === "center"
                  ? "translate(-50%, -100%)"
                  : "translate(-100%, -100%)",
            }}
          >
            <div className="relative px-2 py-1 text-xs rounded bg-ctp-surface0 border-t-2 border-ctp-mauve/65 text-ctp-text whitespace-nowrap">
              {label}
              <svg
                className="absolute top-full text-ctp-surface0"
                style={{
                  left: pos.align === "center" ? "50%" : "auto",
                  right: pos.align === "right" ? "8px" : "auto",
                  transform:
                    pos.align === "center" ? "translateX(-50%)" : "none",
                }}
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
