import { Routes, Route } from "react-router"
import HomePage from "../pages/HomePage"
import PlayAIPage from "../pages/PlayAIPage"
import RoomPage from "../pages/RoomPage"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ai" element={<PlayAIPage />} />
      <Route path="/room/:roomCode" element={<RoomPage />} />
    </Routes>
  )
}