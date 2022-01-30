import { v1 as uuidv1, v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

import cards from "./assets/cards.json";

const shuffle = (cards) => {
	//function to shuffle cards array
	for (var i = cards.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = cards[i];
		cards[i] = cards[j];
		cards[j] = temp;
	}
};

shuffle(cards);
//State
//Will replace this with redis in future
var state = {};
//mapping socket ids to their respective clientIds
var socketIdToClientId = {};
//mapping clientIds to roomIds
var clientIdToRoomId = {};

io.sockets.on("connection", (socket) => {
	// generating Id for newly connected client
	const randomId = uuidv4();
	// assigning a new Id to the client
	socket.emit("welcome", { clientId: randomId });

	//broadcast State function
	const broadcastState = (roomId) => {
		io.sockets.in(roomId).emit("stateUpdate", state[roomId]);
	};

	socket.on("makeGame", (req) => {
		// making client join a newly created room
		const randomRoom = uuidv1();
		socket.join(randomRoom);
		const clientId = req.clientId;

		socketIdToClientId[socket.id] = clientId;
		clientIdToRoomId[clientId] = randomRoom;

		//generaring cards for client
		let strippedDeck = [];
		for (let i = 0; i < 7; i++) strippedDeck.push(cards.pop());

		//updating state
		state[randomRoom] = {
			owner: clientId,
			players: [
				{
					clientId: clientId,
					name: req.name,
					cards: strippedDeck,
				},
			],
			deckStack: cards,
		};
		//returning roomId to the client
		socket.emit("makeGame", { gameId: randomRoom });
		//broadcast This
		broadcastState(randomRoom);
	});

	socket.on("joinGame", (req) => {
		socket.join(req.gameId);
		//generaring cards for client
		let strippedDeck = [];
		for (let i = 0; i < 7; i++) strippedDeck.push(cards.pop());

		const clientId = req.clientId;

		socketIdToClientId[socket.id] = clientId;
		clientIdToRoomId[clientId] = req.gameId;

		//updating state
		state[req.gameId].players.push({
			clientId: clientId,
			name: req.name,
			cards: strippedDeck,
		});
		//broadcast This
		broadcastState(req.gameId);
	});

	socket.on("disconnecting", () => {
		// details about the client who left the server
		const clientId = socketIdToClientId[socket.id];
		const roomId = clientIdToRoomId[clientId];

		if (!roomId || !clientId) return;

		//delete this player from state
		for (let i = 0; i < state[roomId].players.length; i++) {
			if (state[roomId].players[i].clientId === clientId) {
				// delete all records for this player
				state[roomId].players.splice(i, 1);
				socketIdToClientId[socket.id] = null;
				clientIdToRoomId[clientId] = null;
				break;
			}
		}
		broadcastState(roomId);
	});
});

io.listen(8000, () => {
	console.log("Server running on port 8000");
});
