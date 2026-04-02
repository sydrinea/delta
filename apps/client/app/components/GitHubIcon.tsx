import { siGithub } from "simple-icons/icons";

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: siGithub.svg }}
    />
  );
}
