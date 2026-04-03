export default function Offline() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 m-5 text-center">
      <p className="text-ctp-overlay0 font-mono text-sm">offline</p>
      <h1 className="text-ctp-text text-2xl font-bold">no connection</h1>
      <p className="text-ctp-subtext0 text-sm">
        you're offline and this page isn't cached yet
      </p>
      <p className="text-ctp-overlay0 text-xs font-mono">
        delta still works — try the editor or visualizer
      </p>
    </div>
  )
}
