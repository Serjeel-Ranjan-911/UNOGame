import { broadcastState } from "../socket.js";
import { state, socketIdToClientId, clientIdToRoomId } from "../state.js";

export const drawCard = (socket) => {
	socket.on("drawCard", (req) => {
		try {
			// details about the client who played the card
			const clientId = socketIdToClientId[socket.id];
			const roomId = clientIdToRoomId[clientId];
			let numberOfCardsToDraw = 1;

			if (!clientId || !roomId) return;

			// check if its current player turn to play
			if (state[roomId].currentTurn.clientId !== clientId) {
				socket.emit("toast", {
					status: false,
					message: "It is not your turn to play",
				});
				return;
			}

			// check if deck does not contain enough cards to pick
			if (state[roomId].deckStack.length < state[roomId].countOfCardsToPick) {
				// make new deck
				let newDeck = [...cards];
				state[roomId].players.forEach((player) => {
					player.cards.forEach((card) => {
						newDeck.splice(newDeck.indexOf(card), 1);
					});
				});
				state[roomId].deckStack = newDeck;
			}

			//check if any +2 or +4 flag is active
			let hasPlayerPickedPlusTwoCard = false;
			if (state[roomId].activePlus2) {
				hasPlayerPickedPlusTwoCard = true;
				state[roomId].activePlus2 = false;
				numberOfCardsToDraw = state[roomId].countOfCardsToPick;
				state[roomId].countOfCardsToPick = 0;
			}

			let hasPlayerPickedPlusFourCard = false;
			if (state[roomId].activePlus4) {
				hasPlayerPickedPlusFourCard = true;
				state[roomId].activePlus4 = false;
				numberOfCardsToDraw = state[roomId].countOfCardsToPick;
				state[roomId].countOfCardsToPick = 0;

				socket.emit("chooseColor", {});
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
					if (card[0] === "x") return;
					//check if this card is playable card or not
					if (
						state[roomId].stackTop.color === card[0] ||
						state[roomId].stackTop.number === card[1]
					) {
						flag = true;
					}
				});

			if (
				(!hasPlayerPickedPlusFourCard && hasPlayerPickedPlusTwoCard) ||
				!flag
			) {
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
		} catch (err) {
			console.log(err.message);
			socket.emit("toast", {
				status: false,
				message: "Error occured while picking a card 🆘",
			});
		}
	});
};
