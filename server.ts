import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // In-memory state for demo
  let waitingPlayer: { id: string; name: string } | null = null;
  const activeDuels = new Map();
  const leaderboard = [
    { name: "Lê Hoàng", wins: 45 },
    { name: "Trần Thảo", wins: 38 },
    { name: "Phạm Hùng", wins: 32 },
  ];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_queue", (data) => {
      const playerName = data.name || "Người chơi ẩn danh";
      
      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        // Match found!
        const duelId = `duel_${Date.now()}`;
        const opponent = waitingPlayer;
        waitingPlayer = null;

        const problems = generateProblems(10);
        
        socket.join(duelId);
        io.to(opponent.id).emit("match_found", { 
          duelId, 
          opponent: { name: playerName },
          problems 
        });
        
        socket.emit("match_found", { 
          duelId, 
          opponent: { name: opponent.name },
          problems 
        });

        activeDuels.set(duelId, {
          players: [
            { id: socket.id, name: playerName, score: 0, finished: false },
            { id: opponent.id, name: opponent.name, score: 0, finished: false }
          ]
        });
      } else {
        waitingPlayer = { id: socket.id, name: playerName };
        socket.emit("waiting_for_opponent");
      }
    });

    socket.on("submit_answer", (data) => {
      const { duelId, score, finished } = data;
      const duel = activeDuels.get(duelId);
      
      if (duel) {
        const player = duel.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.score = score;
          player.finished = finished;
          
          // Broadcast update to the other player
          socket.to(duelId).emit("opponent_update", { score, finished });

          if (duel.players.every((p: any) => p.finished)) {
            const winner = duel.players.reduce((prev: any, current: any) => 
              (prev.score > current.score) ? prev : current
            );
            io.to(duelId).emit("duel_end", { winner: winner.name });
            activeDuels.delete(duelId);
          }
        }
      }
    });

    socket.on("disconnect", () => {
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
      }
    });
  });

  function generateProblems(count: number) {
    const problems = [];
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const op = ["+", "-", "*"][Math.floor(Math.random() * 3)];
      let question = `${a} ${op} ${b}`;
      let answer = 0;
      if (op === "+") answer = a + b;
      if (op === "-") answer = a - b;
      if (op === "*") answer = a * b;
      problems.push({ question, answer });
    }
    return problems;
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
