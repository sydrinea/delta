interface CenteredProps {
  children: React.ReactNode
}

export default function Centered({ children }: CenteredProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      {children}
    </div>
  )
}
