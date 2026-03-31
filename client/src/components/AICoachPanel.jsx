import { useState } from "react"
import axios from "axios"

const baseUrl = "https://chess-server.maulanaakhmad.site"

export default function AICoachPanel({ fen, history, mode }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  async function handleAskCoach() {
    try {
      setLoading(true)
      setError("")

      const { data } = await axios.post(`${baseUrl}/ai/coach`, {
        fen,
        history,
        side: "white",
      })

      setResult(data)
    } catch (error) {
      setError("Failed to get coach response")
    } finally {
      setLoading(false)
    }
  }

  if (mode !== "ai") {
    return null
  }

  return (
    <div className="bg-chess-card border border-chess-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🤖</span> AI Coach
        </h3>
        <button
          onClick={handleAskCoach}
          disabled={loading}
          className="px-4 py-1.5 bg-chess-accent/15 border border-chess-accent/25 hover:bg-chess-accent/25 text-chess-accent text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-chess-accent/30 border-t-chess-accent rounded-full animate-spin"></span>
              Thinking...
            </span>
          ) : (
            "Get Hint"
          )}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-chess-danger/10 border border-chess-danger/20 rounded-lg mb-3">
          <p className="text-chess-danger text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-2.5">
          <div className="px-3 py-2 bg-chess-accent-dim rounded-lg">
            <p className="text-xs text-chess-text-muted mb-0.5">Suggested Move</p>
            <p className="text-chess-accent font-mono font-semibold text-base">{result.suggestedMove}</p>
          </div>

          {result.threats && (
            <div className="px-3 py-2 bg-chess-danger/5 border border-chess-danger/15 rounded-lg">
              <p className="text-xs text-chess-text-muted mb-0.5">Opponent Threats</p>
              <p className="text-red-300 text-sm">{result.threats}</p>
            </div>
          )}

          {result.plan && (
            <div className="px-3 py-2 bg-chess-info/5 border border-chess-info/15 rounded-lg">
              <p className="text-xs text-chess-text-muted mb-0.5">Your Plan (2–3 moves)</p>
              <p className="text-blue-300 text-sm">{result.plan}</p>
            </div>
          )}

          <div className="px-3 py-2 bg-chess-darker rounded-lg">
            <p className="text-xs text-chess-text-muted mb-0.5">Why This Move</p>
            <p className="text-chess-text text-sm">{result.explanation}</p>
          </div>

          <div className="px-3 py-2 bg-chess-warning/5 border border-chess-warning/10 rounded-lg">
            <p className="text-xs text-chess-text-muted mb-0.5">Warning</p>
            <p className="text-chess-warning text-sm">{result.warning}</p>
          </div>

          <div className="px-3 py-2 bg-chess-accent/5 border border-chess-accent/10 rounded-lg">
            <p className="text-xs text-chess-text-muted mb-0.5">Coach</p>
            <p className="text-chess-accent-light text-sm">{result.coachMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}
