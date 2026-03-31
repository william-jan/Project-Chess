import { useNavigate } from "react-router"
import ChessBoard from "../components/ChessBoard"

export default function PlayAIPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Play vs AI
            </h1>
            <p className="text-chess-text-muted mt-1">
              Kamu bermain sebagai White. Setelah kamu jalan, AI akan membalas otomatis.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-chess-hover border border-chess-border hover:border-chess-text-muted text-chess-text-muted rounded-xl transition-all duration-200 text-sm cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <ChessBoard mode="ai" />
      </div>
    </div>
  )
}
