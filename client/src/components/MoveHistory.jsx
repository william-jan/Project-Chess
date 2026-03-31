export default function MoveHistory({ history }) {
  return (
    <div className="bg-chess-card border border-chess-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Move History</h3>

      {history.length === 0 ? (
        <p className="text-chess-text-muted text-sm">Belum ada langkah</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {history.map((move, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-2.5 py-1 bg-chess-darker rounded-lg text-sm"
              >
                <span className="text-chess-text-muted text-xs w-5 text-right">{index + 1}.</span>
                <span className="text-white font-mono text-xs">{move}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
