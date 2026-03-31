import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useGame } from "../context/GameContext"
import { useSocket } from "../context/SocketContext"
import OnlineChessBoard from "../components/OnlineChessBoard"

export default function RoomPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()

  const {
    playerColor,
    setPlayerColor,
    players,
    setPlayers,
    fen,
    setFen,
    history,
    setHistory,
    turn,
    setTurn,
  } = useGame()

  const [error, setError] = useState("")

  useEffect(() => {
    const savedSession = localStorage.getItem("onlineRoomSession")

    if (savedSession) {
      const parsed = JSON.parse(savedSession)

      if (parsed.roomCode === roomCode) {
        setPlayerColor(parsed.playerColor || "")
        socket.emit("room:rejoin", {
          roomCode: parsed.roomCode,
          playerName: parsed.playerName,
          playerColor: parsed.playerColor,
        })
      }
    }

    function handleRoomJoined(data) {
      const currentSocketId = socket.id
      const me = data.players.find((el) => el.socketId === currentSocketId)

      setFen(data.fen)
      setHistory(data.history || [])
      setPlayers(data.players)
      setTurn(data.turn || "w")

      if (me) {
        setPlayerColor(me.color)

        localStorage.setItem(
          "onlineRoomSession",
          JSON.stringify({
            mode: "online",
            roomCode: data.roomCode,
            playerColor: me.color,
            playerName: me.name,
          })
        )
      }
    }

    function handleRoomUpdate(data) {
      setFen(data.fen)
      setHistory(data.history)
      setPlayers(data.players)
      setTurn(data.turn)
    }

    function handleRoomError(message) {
      setError(message)
    }

    socket.on("room:joined", handleRoomJoined)
    socket.on("room:update", handleRoomUpdate)
    socket.on("room:error", handleRoomError)

    return () => {
      socket.off("room:joined", handleRoomJoined)
      socket.off("room:update", handleRoomUpdate)
      socket.off("room:error", handleRoomError)
    }
  }, [socket, roomCode, setFen, setHistory, setPlayers, setTurn, setPlayerColor])

  function handleLeaveRoom() {
    localStorage.removeItem("onlineRoomSession")
    navigate("/")
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Online Room
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-chess-accent-dim border border-chess-accent/20 rounded-lg text-chess-accent text-sm font-mono">
                {roomCode}
              </span>
              <span className="text-chess-text-muted text-sm">
                You: <span className="text-white font-medium">{playerColor}</span>
              </span>
              <span className="text-chess-text-muted text-sm">
                Turn: <span className={turn === "w" ? "text-white font-medium" : "text-chess-text-muted font-medium"}>{turn === "w" ? "White" : "Black"}</span>
              </span>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-chess-danger/10 border border-chess-danger/20 hover:bg-chess-danger/20 text-chess-danger rounded-xl transition-all duration-200 text-sm cursor-pointer"
          >
            Leave Room
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {players.map((player, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-chess-card border border-chess-border rounded-xl"
              >
                <div className={`w-2 h-2 rounded-full ${player.isConnected ? "bg-chess-accent" : "bg-chess-text-muted"}`}></div>
                <span className="text-white text-sm font-medium">{player.name}</span>
                <span className="text-chess-text-muted text-xs">({player.color})</span>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-chess-danger/10 border border-chess-danger/20 rounded-xl mb-4">
            <span className="text-chess-danger text-sm">{error}</span>
          </div>
        )}

        {players.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-chess-card border border-chess-border rounded-2xl">
            <div className="animate-pulse text-4xl mb-4">♟</div>
            <p className="text-chess-text-muted text-lg">Waiting for second player...</p>
            <p className="text-chess-text-muted/50 text-sm mt-2">Share the room code to invite</p>
          </div>
        ) : (
          fen && (
            <div className="flex flex-col items-center">
              <OnlineChessBoard
                fen={fen}
                playerColor={playerColor}
                turn={turn}
                socket={socket}
                roomCode={roomCode}
              />
            </div>
          )
        )}

        {history.length > 0 && (
          <div className="mt-6 bg-chess-card border border-chess-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Move History</h3>
            <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 list-none p-0 m-0">
              {history.map((move, index) => {
                return (
                  <li
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-chess-darker rounded-lg text-sm"
                  >
                    <span className="text-chess-text-muted">{index + 1}.</span>
                    <span className="text-white font-mono">{move}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
