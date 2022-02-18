import { broadcastState } from "../socket.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const joinGame = (socket,req) => {
	try {
		if(!req.gameId)
			throw Error("No gameId provided");
		
		//check if the game id is present in state or not
		if (!state[req.gameId]) {
			socket.emit("toast", {
				status: false,
				message: "This Game room does not exist",
			});
			throw Error("This Game room does not exist");
		}

		//check if the game is full or not
		if (state[req.gameId].players.length > 10) {
			socket.emit("toast", {
				status: false,
				message: "This Game room is full",
			});
			throw Error("This Game room is full");
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
	} catch (err) {
		console.log(err.message);
		socket.emit("toast", {
			status: false,
			message: "Error occured while joining the game 🆘",
		});
	}
};
