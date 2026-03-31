import { useEffect, useRef, useState } from "react"
import { Chess } from "chess.js"
import { Chessground } from "@lichess-org/chessground"
import GameStatus from "./GameStatus"
import MoveHistory from "./MoveHistory"
import ControlPanel from "./ControlPanel"
import AICoachPanel from "./AICoachPanel"

function fenToDests(chess) {
  const dests = new Map()
  const moves = chess.moves({ verbose: true })

  for (let move of moves) {
    if (!dests.has(move.from)) {
      dests.set(move.from, [])
    }

    dests.get(move.from).push(move.to)
  }

  return dests
}

function getPieceValue(piece) {
  if (piece.type === "p") return 100
  if (piece.type === "n") return 320
  if (piece.type === "b") return 330
  if (piece.type === "r") return 500
  if (piece.type === "q") return 900
  if (piece.type === "k") return 20000
  return 0
}

function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    if (chess.turn() === "w") {
      return 999999
    } else {
      return -999999
    }
  }

  if (chess.isDraw()) {
    return 0
  }

  const board = chess.board()
  let score = 0

  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue

      const value = getPieceValue(piece)

      if (piece.color === "b") {
        score += value
      } else {
        score -= value
      }
    }
  }

  return score
}

function minimax(chess, depth, isMaximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess)
  }

  const moves = chess.moves()

  if (isMaximizing) {
    let bestScore = -Infinity

    for (let move of moves) {
      const copy = new Chess(chess.fen())
      copy.move(move)

      const score = minimax(copy, depth - 1, false)

      if (score > bestScore) {
        bestScore = score
      }
    }

    return bestScore
  } else {
    let bestScore = Infinity

    for (let move of moves) {
      const copy = new Chess(chess.fen())
      copy.move(move)

      const score = minimax(copy, depth - 1, true)

      if (score < bestScore) {
        bestScore = score
      }
    }

    return bestScore
  }
}

function getBestMove(chess, depth) {
  const moves = chess.moves()
  let bestMove = null
  let bestScore = -Infinity

  for (let move of moves) {
    const copy = new Chess(chess.fen())
    copy.move(move)

    const score = minimax(copy, depth - 1, false)

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

export default function ChessBoard({ mode = "local" }) {
  const boardRef = useRef(null)
  const cgRef = useRef(null)
  const gameRef = useRef(new Chess())

  const [history, setHistory] = useState([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function syncState() {
    setHistory(gameRef.current.history())
    setRefreshKey((prev) => prev + 1)
  }

  function getTurnColor() {
    return gameRef.current.turn() === "w" ? "white" : "black"
  }

  function getMovableColor() {
    if (mode === "ai") {
      return "white"
    }

    return getTurnColor()
  }

  function handleAfterMove(from, to) {
    if (gameRef.current.isGameOver()) {
      applyBoardState()
      return
    }

    if (mode === "ai" && isAiThinking) {
      applyBoardState()
      return
    }

    if (mode === "ai" && gameRef.current.turn() !== "w") {
      applyBoardState()
      return
    }

    try {
      gameRef.current.move({
        from,
        to,
        promotion: "q",
      })
    } catch (error) {
      applyBoardState()
      return
    }

    applyBoardState()
    syncState()

    if (
      mode === "ai" &&
      !gameRef.current.isGameOver() &&
      gameRef.current.turn() === "b"
    ) {
      setIsAiThinking(true)

      setTimeout(() => {
        makeAiMove()
      }, 500)
    }
  }

  function applyBoardState() {
    if (!cgRef.current) {
      return
    }

    cgRef.current.set({
      fen: gameRef.current.fen(),
      turnColor: getTurnColor(),
      movable: {
        free: false,
        color: getMovableColor(),
        dests: fenToDests(gameRef.current),
        events: {
          after: handleAfterMove,
        },
      },
    })
  }

  function handleReset() {
    gameRef.current = new Chess()
    setHistory([])
    setIsAiThinking(false)
    applyBoardState()
    setRefreshKey((prev) => prev + 1)
  }

  function makeAiMove() {
    if (gameRef.current.isGameOver()) {
      setIsAiThinking(false)
      return
    }

    const bestMove = getBestMove(gameRef.current, 2)

    if (!bestMove) {
      setIsAiThinking(false)
      return
    }

    gameRef.current.move(bestMove)
    applyBoardState()
    syncState()
    setIsAiThinking(false)
  }

  useEffect(() => {
    if (!boardRef.current) {
      return
    }

    cgRef.current = Chessground(boardRef.current, {
      fen: gameRef.current.fen(),
      orientation: "white",
      turnColor: "white",
      draggable: {
        enabled: true,
      },
      movable: {
        free: false,
        color: "white",
        dests: fenToDests(gameRef.current),
        events: {
          after: handleAfterMove,
        },
      },
    })

    return () => {
      if (cgRef.current && cgRef.current.destroy) {
        cgRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    applyBoardState()
  }, [refreshKey])

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div
        ref={boardRef}
        className="w-[min(500px,90vw)] h-[min(500px,90vw)] rounded-lg overflow-hidden"
      ></div>

      {mode === "ai" && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
          isAiThinking
            ? "bg-chess-warning/10 border border-chess-warning/20 text-chess-warning"
            : "bg-chess-accent-dim border border-chess-accent/20 text-chess-accent"
        }`}>
          {isAiThinking && (
            <span className="inline-block w-3 h-3 border-2 border-chess-warning/30 border-t-chess-warning rounded-full animate-spin"></span>
          )}
          {isAiThinking ? "AI is thinking..." : "You play as White"}
        </div>
      )}

      <div className="w-full max-w-125 space-y-4">
        <GameStatus game={gameRef.current} />
        <ControlPanel onReset={handleReset} />
        <MoveHistory history={history} />
        <AICoachPanel
          fen={gameRef.current.fen()}
          history={history}
          mode={mode}
        />
      </div>
    </div>
  )
}
