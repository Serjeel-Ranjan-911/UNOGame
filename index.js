import express from "express";
import path from "path";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";

import cards from "./assets/cards.js";


// making the express server
const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.static(path.join("react_build")));

const server = app.listen(PORT, function () {
	console.log(`Listening on port ${PORT}`);
	console.log(`http://localhost:${PORT}`);
});

// running the socket on the express server
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

const shuffle = (cards) => {
	//function to shuffle cards array
	for (var i = cards.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = cards[i];
		cards[i] = cards[j];
		cards[j] = temp;
	}
};

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

		//shuffling a fresh deck of cards for this room
		shuffle(cards);
		const newDeck = [...cards];

		//generaring cards for client
		let strippedDeck = newDeck.splice(0, 7);

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
			deckStack: newDeck, //give a copy to room
			currentTurn: {
				name: req.name,
				clientId,
			},
			stackTop: {
				type: "r7",
				color: "r",
				number: "7",
			},
			dir: 1,
		};
		//returning roomId to the client
		socket.emit("makeGame", { gameId: randomRoom });
		//broadcast This
		broadcastState(randomRoom);
	});

	socket.on("joinGame", (req) => {
		//check if the game id is present in state or not
		if (!state[req.gameId]) {
			socket.emit("toast", {
				status: false,
				message: "This Game room does not exist",
			});
			return;
		}

		//check if the game is full or not
		if (state[req.gameId].players.length > 10) {
			socket.emit("toast", {
				status: false,
				message: "This Game room is full",
			});
		}

		socket.join(req.gameId);

		//generaring cards for client
		let strippedDeck = state[req.gameId].deckStack.splice(0, 7);

		const clientId = req.clientId;

		// store details about client
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
				//take all the cards from the player
				// and merge it with the deck
				state[roomId].deckStack = [
					...state[roomId].deckStack,
					...state[roomId].players[i].cards,
				];

				// delete all records for this player
				state[roomId].players.splice(i, 1);
				socketIdToClientId[socket.id] = null;
				clientIdToRoomId[clientId] = null;
				break;
			}
		}

		// delete other details about the client
		delete socketIdToClientId[socket.id];
		delete clientIdToRoomId[clientId];

		// if the owner left, make the next player the owner
		if (state[roomId].owner === clientId && state[roomId].players.length > 0) {
			state[roomId].owner = state[roomId].players[0].clientId;
		}

		// if the room is empty
		// delete all the details related to it
		if (state[roomId].players.length === 0) {
			console.log("deleting room");
			delete state[roomId];
		}
		broadcastState(roomId);
	});

	socket.on("playCard", (req) => {
		// details about the client who played the card
		const clientId = socketIdToClientId[socket.id];
		const roomId = clientIdToRoomId[clientId];
		const card = req.card;

		// check if its current player turn to play
		if (state[roomId].currentTurn.clientId !== clientId) {
			socket.emit("toast", {
				status: false,
				message: "It is not your turn to play",
			});
			return;
		}

		// if the card is not in the player's hand
		if (
			!state[roomId].players
				.find((player) => player.clientId === clientId)
				.cards.includes(card.type)
		) {
			socket.emit("toast", {
				status: false,
				message: "Player do not own this card",
			});
			return;
		}

		// check if thrown card is playable card or not
		if (
			state[roomId].stackTop.color === card.color ||
			state[roomId].stackTop.number === card.number
		) {
			// if the card is playable,
			// remove the card from the player's hand
			state[roomId].players
				.find((player) => player.clientId === clientId)
				.cards.splice(
					state[roomId].players
						.find((player) => player.clientId === clientId)
						.cards.indexOf(card.type),
					1
				);
			// add the card to the stack
			state[roomId].stackTop = card;

			//check if the card is revese card
			if (card.type[1] === "r") {
				state[roomId].dir *= -1;
			}
			//check if the card is skip card
			let skip = 0;
			if (card.type[1] === "s") {
				skip = 1;
			}

			// select the next player
			// find the index of current player
			const currentPlayerIndex = state[roomId].players.findIndex(
				(player) => player.clientId === clientId
			);

			// check if no card are left in the player's hand
			if (state[roomId].players[currentPlayerIndex].cards.length === 0) {
				// this player wins
				io.sockets.in(roomId).emit("ENDGAME", {
					winner: state[roomId].currentTurn.name,
				});
				broadcastState(roomId);
				return;
			}

			// select the next players
			const nextPlayerIndex =
				(currentPlayerIndex +
					state[roomId].dir +
					skip * state[roomId].dir +
					state[roomId].players.length) %
				state[roomId].players.length;

			// update the current turn
			state[roomId].currentTurn = {
				name: state[roomId].players[nextPlayerIndex].name,
				clientId: state[roomId].players[nextPlayerIndex].clientId,
			};
			// broadcast this
			broadcastState(roomId);
		} else {
			socket.emit("toast", {
				status: false,
				message: "Card is not playable",
			});
			return;
		}
	});

	socket.on("drawCard", (req) => {
		// details about the client who played the card
		const clientId = socketIdToClientId[socket.id];
		const roomId = clientIdToRoomId[clientId];
		const numberOfCardsToDraw = req.numberOfCardsToDraw;

		// check if its current player turn to play
		if (state[roomId].currentTurn.clientId !== clientId) {
			socket.emit("toast", {
				status: false,
				message: "It is not your turn to play",
			});
			return;
		}

		// check if the player has any card left
		if (
			state[roomId].players.find((player) => player.clientId === clientId).cards
				.length === 0
		) {
			socket.emit("toast", {
				status: false,
				message: "You have no card left",
			});
			return;
		}

		// select the top card from the deck
		const card = state[roomId].deckStack.splice(0, numberOfCardsToDraw);

		// add the card to the player's hand
		state[roomId].players
			.find((player) => player.clientId === clientId)
			.cards.push(...card);

		// check if player has any playable card
		let flag = false;
		state[roomId].players
			.find((player) => player.clientId === clientId)
			.cards.forEach((card) => {
				//check if this card is playable card or not
				if (
					card[0] === "x" ||
					state[roomId].stackTop.color === card[0] ||
					state[roomId].stackTop.number === card[1]
				) {
					flag = true;
				}
			});

		if (!flag) {
			// next player should play
			const currentPlayerIndex = state[roomId].players.findIndex(
				(player) => player.clientId === clientId
			);
			// select the next players
			const nextPlayerIndex =
				(currentPlayerIndex +
					state[roomId].dir +
					state[roomId].players.length) %
				state[roomId].players.length;
			// update the current turn
			state[roomId].currentTurn = {
				name: state[roomId].players[nextPlayerIndex].name,
				clientId: state[roomId].players[nextPlayerIndex].clientId,
			};
		}

		// broadcast this
		broadcastState(roomId);
	});
});
