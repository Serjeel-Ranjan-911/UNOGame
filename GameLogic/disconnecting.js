import { broadcastState, broadcastMessage } from "../socket.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const disconnecting = (socket, req) => {
	// details about the client who left the server
	const clientId = socketIdToClientId[socket.id];
	const roomId = clientIdToRoomId[clientId];

	try {
		if (!roomId || !clientId) return;

		let playerName = "🥺";
		//delete this player from state
		for (let i = 0; i < state[roomId].players.length; i++) {
			if (state[roomId].players[i].clientId === clientId) {
				//take all the cards from the player
				// and merge it with the deck
				state[roomId].deckStack = [
					...state[roomId].deckStack,
					...state[roomId].players[i].cards,
				];

				playerName = state[roomId].players[i].name;
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
			delete state[roomId];
		}
		broadcastState(roomId);

		//Inform others in room
		broadcastMessage(roomId, playerName + " has left the game 😢");
	} catch (err) {
		console.log(err.message);
		socket.emit("toast", {
			status: false,
			message: "Error occured while disconnecting 🆘",
		});
		broadcastState(roomId);
	}
};
