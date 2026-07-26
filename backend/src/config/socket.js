const { Server } = require("socket.io");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connecte via Socket.IO :", socket.id);

    socket.on("joinParcelle", (parcelleId) => {
      socket.join(`parcelle_${parcelleId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client deconnecte :", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO n'a pas encore ete initialise.");
  }
  return io;
}

module.exports = { initSocket, getIO };
