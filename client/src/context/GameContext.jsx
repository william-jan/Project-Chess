import { createContext, useContext, useState } from "react"

const GameContext = createContext()

export function GameProvider({ children }) {
  const [mode, setMode] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [playerColor, setPlayerColor] = useState("")
  const [players, setPlayers] = useState([])

  const [fen, setFen] = useState("")
  const [history, setHistory] = useState([])
  const [turn, setTurn] = useState("w")

  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        roomCode,
        setRoomCode,
        playerName,
        setPlayerName,
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
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}