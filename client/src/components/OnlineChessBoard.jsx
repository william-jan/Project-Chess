import { useEffect, useRef } from "react"
import { Chess } from "chess.js"
import { Chessground } from "@lichess-org/chessground"

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

export default function OnlineChessBoard({
  fen,
  playerColor,
  turn,
  socket,
  roomCode,
}) {
  const boardRef = useRef(null)
  const cgRef = useRef(null)

  function applyBoardState(currentFen) {
    if (!cgRef.current || !currentFen) {
      return
    }

    const chess = new Chess(currentFen)

    cgRef.current.set({
      fen: currentFen,
      orientation: playerColor || "white",
      turnColor: chess.turn() === "w" ? "white" : "black",
      movable: {
        free: false,
        color: playerColor || "white",
        dests: fenToDests(chess),
        events: {
          after: (from, to) => {
            const currentTurnColor = chess.turn() === "w" ? "white" : "black"

            if (playerColor !== currentTurnColor) {
              applyBoardState(currentFen)
              return
            }

            socket.emit("room:move", {
              roomCode,
              from,
              to,
            })
          },
        },
      },
    })
  }

  useEffect(() => {
    if (!boardRef.current || !fen) {
      return
    }

    cgRef.current = Chessground(boardRef.current, {
      fen,
      orientation: playerColor || "white",
      turnColor: turn === "w" ? "white" : "black",
      draggable: {
        enabled: true,
      },
      movable: {
        free: false,
        color: playerColor || "white",
        dests: fenToDests(new Chess(fen)),
        events: {
          after: (from, to) => {
            const chess = new Chess(fen)
            const currentTurnColor = chess.turn() === "w" ? "white" : "black"

            if (playerColor !== currentTurnColor) {
              applyBoardState(fen)
              return
            }

            socket.emit("room:move", {
              roomCode,
              from,
              to,
            })
          },
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
    applyBoardState(fen)
  }, [fen, playerColor, turn])

  return (
    <div
      ref={boardRef}
      className="w-[min(500px,90vw)] h-[min(500px,90vw)] mt-4 rounded-lg overflow-hidden"
    ></div>
  )
}
