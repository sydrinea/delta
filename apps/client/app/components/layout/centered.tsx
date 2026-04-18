export default function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      {children}
    </div>
  )
}
