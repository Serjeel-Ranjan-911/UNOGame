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

io.sockets.on("connection", (socket) => {
	// generating Id for newly connected client
	const randomId = uuidv4();
	// assigning a new Id to the client
	socket.emit("welcome", { clientId: randomId });

	makeGame(socket);
    joinGame(socket);
    playCard(socket);
    setColor(socket)
    drawCard(socket);
	disconnecting(socket);

});
