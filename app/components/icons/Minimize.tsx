import { SVGProps } from "react";

export function Minimize(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
      <polyline points="10 4 10 10 4 10" />
      <polyline points="14 20 14 14 20 14" />
      <line x1="14" y1="14" x2="21" y2="21" />
      <line x1="3" y1="3" x2="10" y2="10" />
    </svg>
  );
}
