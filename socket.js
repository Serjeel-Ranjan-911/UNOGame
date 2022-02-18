import { server } from "./server.js";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

import { state } from "./state.js";

// running the socket on the express server
export const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// import game logic
import { makeGame } from "./GameLogic/makeGame.js";
import { joinGame } from "./GameLogic/joinGame.js";
import { disconnecting } from "./GameLogic/disconnecting.js";
import { playCard } from "./GameLogic/playCard.js";
import { setColor } from "./GameLogic/setColor.js";
import { drawCard } from "./GameLogic/drawCard.js";

//broadcast State function
export const broadcastState = (roomId) => {
	io.sockets.in(roomId).emit("stateUpdate", state[roomId]);
};

//boradcast message to all
export const broadcastMessage = (roomId, message) => {	
	io.sockets.in(roomId).emit("toast", {
		status: true,
		message,
	});
};

export const Endgame = (roomId) => {
	io.sockets.in(roomId).emit("ENDGAME", {
		winner: state[roomId].currentTurn.name,
	});
	broadcastState(roomId);
};

//listening to the socket
io.sockets.on("connection", (socket) => {
	// generating Id for newly connected client
	const randomId = uuidv4();
	// assigning a new Id to the client
	socket.emit("welcome", { clientId: randomId });

	socket.on("makeGame", (req) => {
		makeGame(socket, req);
	});

	socket.on("joinGame", (req) => {
		joinGame(socket, req);
	});

	socket.on("playCard", (req) => {
		playCard(socket, req);
	});

	socket.on("setColor", (req) => {
		setColor(socket, req);
	});

	socket.on("drawCard", (req) => {
		drawCard(socket, req);
	});

	socket.on("disconnecting", (req) => {
		disconnecting(socket, req);
	});
});
