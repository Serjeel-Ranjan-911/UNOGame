import { broadcastState } from "../socket.js";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";

import cards from "../assets/cards.js";
import { shuffle } from "../util.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const makeGame = (socket,req) => {
	try {
		// making client join a newly created room
		const randomRoom = uuidv1();
		socket.join(randomRoom);
		const clientId = req.clientId;

		if (!clientId) throw Error("No Client Id provided");

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
				type: "none",
				color: "",
				number: "",
			},
			dir: 1,
			countOfCardsToPick: 0,
			activePlus2: false,
			activePlus4: false,
		};
		//returning roomId to the client
		socket.emit("makeGame", { gameId: randomRoom });
		//broadcast This
		broadcastState(randomRoom);
	} catch (err) {
		console.log(err.message);
		socket.emit("toast", {
			status: false,
			message: "Error occured while making the game 🆘",
		});
	}
};
