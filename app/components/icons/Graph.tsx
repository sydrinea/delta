export function Graph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <line x1="12" y1="9" x2="5" y2="6" />
      <line x1="12" y1="9" x2="19" y2="6" />
      <line x1="12" y1="15" x2="5" y2="18" />
      <line x1="12" y1="15" x2="19" y2="18" />
    </svg>
  );
}
