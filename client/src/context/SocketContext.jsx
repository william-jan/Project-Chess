import { createContext, useContext } from "react"
import { io } from "socket.io-client"

const SocketContext = createContext()

const socket = io("https://chess-server.maulanaakhmad.site")

export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}