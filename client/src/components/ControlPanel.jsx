export default function ControlPanel({ onReset }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onReset}
        className="flex-1 px-4 py-2.5 bg-chess-hover border border-chess-border hover:border-chess-danger hover:bg-chess-danger/10 hover:text-chess-danger text-chess-text-muted font-medium rounded-xl transition-all duration-200 cursor-pointer"
      >
        Reset Game
      </button>
    </div>
  )
}
