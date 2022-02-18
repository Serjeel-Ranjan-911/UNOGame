import { broadcastState, Endgame } from "../socket.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const playCard = (socket, req) => {
	try {
		// details about the client who played the card
		const clientId = socketIdToClientId[socket.id];
		const roomId = clientIdToRoomId[clientId];
		const card = req.card;

		if(!card)
			throw Error("No card provided");

		// check if its current player turn to play
		if (state[roomId].currentTurn.clientId !== clientId) {
			console.log(state[roomId].currentTurn.clientId , clientId)
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
		// if +2 flag is set accept only +2 card
		if (state[roomId].activePlus2 && card.type[1] !== "p") {
			socket.emit("toast", {
				status: false,
				message: "Either throw a +2 card (or) pick cards",
			});
			return;
		}

		// if +4 flag is set accept only +4 card
		if (state[roomId].activePlus4 && card.type !== "x4") {
			socket.emit("toast", {
				status: false,
				message: "Either throw a +4 card (or) pick cards",
			});
			return;
		}

		// check if thrown card is playable card or not (OR) if it's start of the game
		if (
			card.type[0] === "x" ||
			state[roomId].stackTop.type === "none" ||
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

			//check if the card is +2 card
			if (card.type[1] === "p") {
				//check if this is the first +2 card
				if (!state[roomId].activePlus2) {
					//set +2 flag
					state[roomId].activePlus2 = true;
					state[roomId].countOfCardsToPick = 2;
				} else {
					state[roomId].countOfCardsToPick += 2;
				}
			}

			//check if the card is +4 card
			if (card.type === "x4") {
				//check if this is the first +4 card
				if (!state[roomId].activePlus4) {
					//set +2 flag
					state[roomId].activePlus4 = true;
					state[roomId].countOfCardsToPick = 4;
				} else {
					state[roomId].countOfCardsToPick += 4;
				}
			}

			//check if the card is color change card
			if (card.type == "xc") {
				socket.emit("chooseColor", {});
				return;
			}

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
				Endgame(roomId);
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
	} catch (err) {
		console.log(err.message);
		socket.emit("toast", {
			status: false,
			message: "Error occured while throwing a card 🆘",
		});
	}
};
