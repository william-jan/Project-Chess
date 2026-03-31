import { useNavigate } from "react-router"
import { useGame } from "../context/GameContext"
import { useSocket } from "../context/SocketContext"
import { useEffect, useState } from "react"

export default function HomePage() {
  const navigate = useNavigate()
  const { socket } = useSocket()

  const {
    setMode,
    setPlayerName,
    setRoomCode,
    setPlayerColor,
    setPlayers,
    setFen,
    setHistory,
    setTurn,
  } = useGame()

  const [name, setName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")

  function saveRoomSession(data) {
    localStorage.setItem(
      "onlineRoomSession",
      JSON.stringify({
        mode: "online",
        roomCode: data.roomCode,
        playerColor: data.playerColor,
        playerName: data.playerName,
      })
    )
  }

  function handlePlayAI() {
    setMode("ai")
    setPlayerName(name)
    navigate("/ai")
  }

  function handleCreateRoom() {
    setError("")
    setMode("online")
    setPlayerName(name)

    socket.emit("room:create", {
      playerName: name,
    })
  }

  function handleJoinRoom() {
    setError("")
    setMode("online")
    setPlayerName(name)

    socket.emit("room:join", {
      roomCode: joinCode.toUpperCase(),
      playerName: name,
    })
  }

  useEffect(() => {
    function handleRoomCreated(data) {
      setRoomCode(data.roomCode)
      setPlayerColor(data.color)
      setPlayers(data.players)
      setFen(data.fen)
      setHistory(data.history || [])
      setTurn(data.turn || "w")

      saveRoomSession({
        roomCode: data.roomCode,
        playerColor: data.color,
        playerName: name || "Player 1",
      })

      navigate(`/room/${data.roomCode}`)
    }

    function handleRoomJoined(data) {
      const currentSocketId = socket.id
      const me = data.players.find((el) => el.socketId === currentSocketId)

      setRoomCode(data.roomCode)
      setPlayerColor(me ? me.color : "")
      setPlayers(data.players)
      setFen(data.fen)
      setHistory(data.history || [])
      setTurn(data.turn || "w")

      saveRoomSession({
        roomCode: data.roomCode,
        playerColor: me ? me.color : "",
        playerName: me ? me.name : name || "Player 2",
      })

      navigate(`/room/${data.roomCode}`)
    }

    function handleRoomError(message) {
      setError(message)
    }

    socket.on("room:created", handleRoomCreated)
    socket.on("room:joined", handleRoomJoined)
    socket.on("room:error", handleRoomError)

    return () => {
      socket.off("room:created", handleRoomCreated)
      socket.off("room:joined", handleRoomJoined)
      socket.off("room:error", handleRoomError)
    }
  }, [socket, name, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">♔</div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Realtime Chess
          </h1>
          <p className="text-chess-text-muted text-lg">
            Main catur lawan AI atau lawan teman secara online.
          </p>
        </div>

        <div className="bg-chess-card border border-chess-border rounded-2xl p-8 shadow-xl shadow-black/20 space-y-6">
          <div>
            <label className="block text-sm font-medium text-chess-text-muted mb-2">
              Nama Pemain
            </label>
            <input
              type="text"
              placeholder="Masukkan nama"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 bg-chess-darker border border-chess-border rounded-xl text-white placeholder-chess-text-muted/50 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePlayAI}
              className="px-4 py-3 bg-chess-accent hover:bg-chess-accent-light text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-chess-accent/20 cursor-pointer"
            >
              Play vs AI
            </button>

            <button
              onClick={handleCreateRoom}
              className="px-4 py-3 bg-chess-hover border border-chess-border hover:border-chess-accent text-white font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Create Room
            </button>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-chess-border"></div>
            <span className="text-chess-text-muted text-sm">atau join room</span>
            <div className="flex-1 h-px bg-chess-border"></div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Masukkan room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              className="flex-1 px-4 py-3 bg-chess-darker border border-chess-border rounded-xl text-white placeholder-chess-text-muted/50 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent transition-colors uppercase"
            />

            <button
              onClick={handleJoinRoom}
              className="px-6 py-3 bg-chess-info/20 border border-chess-info/30 hover:bg-chess-info/30 text-chess-info font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Join
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-chess-danger/10 border border-chess-danger/20 rounded-xl">
              <span className="text-chess-danger text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
