import "./index.css"
import "@lichess-org/chessground/assets/chessground.base.css"
import "@lichess-org/chessground/assets/chessground.brown.css"
import "@lichess-org/chessground/assets/chessground.cburnett.css"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router"
import App from "./App"
import { GameProvider } from "./context/GameContext"
import { SocketProvider } from "./context/SocketContext"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SocketProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SocketProvider>
  </BrowserRouter>
)