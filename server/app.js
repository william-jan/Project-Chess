if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env");
}



const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

app.get("/", (req, res) => {
  res.send("Chess server is running");
});

function analyzePosition(fen) {
  const chess = new Chess(fen);

  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const board = chess.board();

  let whiteMaterial = 0;
  let blackMaterial = 0;
  const whitePieces = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const blackPieces = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === "k") continue;
      if (piece.color === "w") {
        whiteMaterial += pieceValues[piece.type];
        whitePieces[piece.type]++;
      } else {
        blackMaterial += pieceValues[piece.type];
        blackPieces[piece.type]++;
      }
    }
  }

  const legalMoves = chess.moves();
  const turn = chess.turn() === "w" ? "white" : "black";
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const materialAdvantage = whiteMaterial - blackMaterial;

  return {
    turn,
    isCheck,
    isCheckmate,
    isStalemate,
    legalMoveCount: legalMoves.length,
    legalMoves: legalMoves.slice(0, 20),
    whiteMaterial,
    blackMaterial,
    materialAdvantage,
    whitePieces,
    blackPieces,
  };
}

app.post("/ai/coach", async (req, res) => {
  try {
    const { fen, history, side } = req.body;

    if (!fen) {
      return res.status(400).send("FEN is required");
    }

    const playerSide = side || "white";
    const opponentSide = playerSide === "white" ? "black" : "white";
    const pos = analyzePosition(fen);

    const materialStatus =
      pos.materialAdvantage === 0
        ? "Material is equal."
        : pos.materialAdvantage > 0
          ? `White is ahead by ${pos.materialAdvantage} point(s).`
          : `Black is ahead by ${Math.abs(pos.materialAdvantage)} point(s).`;

    const positionStatus = pos.isCheckmate
      ? "The game is over by checkmate."
      : pos.isStalemate
        ? "The game is over by stalemate."
        : pos.isCheck
          ? `${pos.turn} is currently in CHECK.`
          : `It is ${pos.turn}'s turn to move.`;

    const prompt = `
Analyze the following chess position and provide strategic coaching.

=== POSITION CONTEXT ===
FEN: ${fen}
Move history (${Array.isArray(history) ? history.length : 0} moves): ${Array.isArray(history) && history.length > 0 ? history.join(", ") : "Game just started"}

=== COMPUTED POSITION DATA ===
Turn: ${pos.turn}
Status: ${positionStatus}
${materialStatus}
White material: ${pos.whiteMaterial} pts (${pos.whitePieces.q}Q ${pos.whitePieces.r}R ${pos.whitePieces.b}B ${pos.whitePieces.n}N ${pos.whitePieces.p}P)
Black material: ${pos.blackMaterial} pts (${pos.blackPieces.q}Q ${pos.blackPieces.r}R ${pos.blackPieces.b}B ${pos.blackPieces.n}N ${pos.blackPieces.p}P)
Legal moves available for ${pos.turn}: ${pos.legalMoveCount} moves
Some legal moves: ${pos.legalMoves.join(", ")}

=== YOUR TASK (think step by step) ===
You are coaching the player who controls ${playerSide} pieces.

Step 1 - Identify threats: What is ${opponentSide} threatening right now? Any immediate captures, forks, pins, or checkmate threats?
Step 2 - Assess the position: Is ${playerSide} better, worse, or equal? What are the positional weaknesses?
Step 3 - Build a plan: What should ${playerSide}'s strategy be for the next 2-3 moves? (e.g., develop pieces, control center, attack, defend)
Step 4 - Pick the best move: From the legal moves listed above, which single move best fits the plan? Write it in SAN notation.

=== RESPONSE FORMAT ===
Return ONLY valid JSON with exactly this shape:
{
  "suggestedMove": "the single best move in SAN notation",
  "plan": "describe the 2-3 move plan in simple terms",
  "threats": "what the opponent is threatening right now",
  "explanation": "why this specific move is the best choice now",
  "warning": "one key danger to watch out for",
  "coachMessage": "short encouraging message for the player"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are an experienced chess coach with deep knowledge of tactics, strategy, and endgames. You analyze positions carefully and give precise, actionable advice. You always base your suggestions on the actual legal moves available. Your explanations are clear and helpful for improving players. You never make up moves — only suggest moves from the provided legal moves list.",
              },
            ],
          },
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(500)
        .send(data.error?.message || "Gemini request failed");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = {
        suggestedMove: "",
        plan: "",
        threats: "",
        explanation: "AI response could not be parsed.",
        warning: "",
        coachMessage: "",
      };
    }

    res.send(parsed);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("room:create", ({ playerName }) => {
    const roomCode = generateRoomCode();

    rooms[roomCode] = {
      code: roomCode,
      game: new Chess(),
      players: [
        {
          socketId: socket.id,
          name: playerName || "Player 1",
          color: "white",
          isConnected: true,
        },
      ],
    };

    socket.join(roomCode);

    socket.emit("room:created", {
      roomCode,
      color: "white",
      fen: rooms[roomCode].game.fen(),
      history: rooms[roomCode].game.history(),
      turn: rooms[roomCode].game.turn(),
      players: rooms[roomCode].players,
    });
  });

  socket.on("room:join", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("room:error", "Room is full");
      return;
    }

    const blackPlayer = {
      socketId: socket.id,
      name: playerName || "Player 2",
      color: "black",
      isConnected: true,
    };

    room.players.push(blackPlayer);
    socket.join(roomCode);

    io.to(roomCode).emit("room:joined", {
      roomCode,
      fen: room.game.fen(),
      history: room.game.history(),
      turn: room.game.turn(),
      players: room.players,
    });
  });

  socket.on("room:rejoin", ({ roomCode, playerName, playerColor }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    const player = room.players.find((el) => el.color === playerColor);

    if (!player) {
      socket.emit("room:error", "Player slot not found");
      return;
    }

    player.socketId = socket.id;
    player.isConnected = true;

    if (playerName) {
      player.name = playerName;
    }

    socket.join(roomCode);

    io.to(roomCode).emit("room:joined", {
      roomCode,
      fen: room.game.fen(),
      history: room.game.history(),
      turn: room.game.turn(),
      players: room.players,
    });
  });

  socket.on("room:move", ({ roomCode, from, to }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    if (room.players.length < 2) {
      socket.emit("room:error", "Waiting for second player");
      return;
    }

    const connectedPlayers = room.players.filter((el) => el.isConnected);

    if (connectedPlayers.length < 2) {
      socket.emit("room:error", "Both players must be connected");
      return;
    }

    const player = room.players.find((el) => el.socketId === socket.id);

    if (!player) {
      socket.emit("room:error", "Player not in room");
      return;
    }

    const turnColor = room.game.turn() === "w" ? "white" : "black";

    if (player.color !== turnColor) {
      socket.emit("room:error", "Not your turn");
      return;
    }

    try {
      room.game.move({
        from,
        to,
        promotion: "q",
      });
    } catch (error) {
      socket.emit("room:error", "Invalid move");
      return;
    }

    io.to(roomCode).emit("room:update", {
      roomCode,
      fen: room.game.fen(),
      history: room.game.history(),
      players: room.players,
      turn: room.game.turn(),
      isGameOver: room.game.isGameOver(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let roomCode in rooms) {
      const room = rooms[roomCode];

      const player = room.players.find((el) => el.socketId === socket.id);

      if (player) {
        player.socketId = null;
        player.isConnected = false;

        io.to(roomCode).emit("room:update", {
          roomCode,
          fen: room.game.fen(),
          history: room.game.history(),
          players: room.players,
          turn: room.game.turn(),
          isGameOver: room.game.isGameOver(),
        });
      }
    }
  });
});

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
