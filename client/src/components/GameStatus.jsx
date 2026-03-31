export default function GameStatus({ game }) {
  let statusText = ""
  let turnText = game.turn() === "w" ? "White" : "Black"

  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "Black" : "White"
    statusText = `Checkmate! ${winner} wins`
  } else if (game.isDraw()) {
    statusText = "Draw!"
  } else if (game.isStalemate()) {
    statusText = "Stalemate!"
  } else if (game.isThreefoldRepetition()) {
    statusText = "Draw by threefold repetition!"
  } else if (game.isInsufficientMaterial()) {
    statusText = "Draw by insufficient material!"
  } else {
    statusText = `Turn: ${turnText}`

    if (game.isCheck()) {
      statusText += " - Check!"
    }
  }

  const isGameOver = game.isCheckmate() || game.isDraw() || game.isStalemate()
  const isCheck = game.isCheck() && !game.isCheckmate()

  return (
    <div className={`px-4 py-3 rounded-xl border ${
      isGameOver
        ? "bg-chess-accent-dim border-chess-accent/20"
        : isCheck
          ? "bg-chess-warning/10 border-chess-warning/20"
          : "bg-chess-card border-chess-border"
    }`}>
      <p className={`text-sm font-medium ${
        isGameOver
          ? "text-chess-accent"
          : isCheck
            ? "text-chess-warning"
            : "text-chess-text"
      }`}>
        {statusText}
      </p>
    </div>
  )
}
