import { broadcastState } from "../socket.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const setColor = (socket) => {
	socket.on("setColor", (req) => {
		try {
			// details about the client who played the card
			const clientId = socketIdToClientId[socket.id];
			const roomId = clientIdToRoomId[clientId];
			const color = req.color;

			// check if its current player turn to play
			if (state[roomId].currentTurn.clientId !== clientId) {
				socket.emit("toast", {
					status: false,
					message: "It is not your turn to play",
				});
				return;
			}

			//change the active color to play
			state[roomId].stackTop = {
				type: "xc",
				color: color,
				number: "",
			};

			// select the next player
			// find the index of current player
			const currentPlayerIndex = state[roomId].players.findIndex(
				(player) => player.clientId === clientId
			);

			// check if no card are left in the player's hand
			if (state[roomId].players[currentPlayerIndex].cards.length === 0) {
				// this player wins
				//(bug currenTurn is undefined for some reason sometimes)
				if (!state[roomId].currentTurn) {
					io.sockets.in(roomId).emit("ENDGAME", {
						winner: "😜",
					});
				} else {
					io.sockets.in(roomId).emit("ENDGAME", {
						winner: state[roomId].currentTurn.name,
					});
				}
				broadcastState(roomId);
				return;
			}

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
			// broadcast this
			broadcastState(roomId);
		} catch (err) {
			console.log(err.message);
			socket.emit("toast", {
				status: false,
				message: "Error occured while changing the color 🆘",
			});
		}
	});
};
