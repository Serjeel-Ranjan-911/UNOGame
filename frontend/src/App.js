import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import uuid from "react-uuid";
import Deck from "./Deck/Deck.js";

function App() {
	const [clientId, setClientId] = useState(null);
	const [gameId, setGameId] = useState("");
	const [socket, setSocket] = useState(null);
	const [gameState, setGameState] = useState(null); //to store game state coming from server
	const [aboutPlayer, setAboutPlayer] = useState({ name: "", cards: [] }); //data shown in UI

	useEffect(() => {
		const newSocket = io("http://192.168.101.7:8000");
		setSocket(newSocket);
		//try to get room id from url
		const query = new URLSearchParams(window.location.search);
		const roomId = query.get("roomId");
		if (roomId) {
			setGameId(roomId);
		}
	}, []);

	useEffect(() => {
		if (!socket) return;
		socket.on("connect", () => {
			//code on connect
		});
		socket.on("welcome", (res) => {
			setClientId(res.clientId);
		});
		socket.on("stateUpdate", (res) => {
			setGameState(res);
		});

		socket.on("makeGame", (res) => {
			setGameId(res.gameId);
		});
	}, [socket]);

	useEffect(() => {
		if (!gameState) return;
		for (let i = 0; i < gameState.players.length; i++) {
			if (gameState.players[i].clientId === clientId) {
				setAboutPlayer({
					...aboutPlayer,
					cards: gameState.players[i].cards.map((card, i) => ({
						type: card,
						id: uuid(),
					})),
				});
			}
		}
	}, [gameState]);

	const makeGame = () => {
		if (!aboutPlayer.name || aboutPlayer.name.length < 3) {
			alert("Please enter a valid name");
			return;
		}

		socket.emit("makeGame", {
			name: aboutPlayer.name,
			clientId: clientId,
		});
	};

	const joinGame = () => {
		if (!aboutPlayer.name || aboutPlayer.name.length < 3) {
			alert("Please enter a valid name");
			return;
		}

		socket.emit("joinGame", {
			clientId: clientId,
			name: aboutPlayer.name,
			gameId: gameId,
		});
	};

	const throwCard = (id) => {
		aboutPlayer.cards.forEach((card) => {
			if (card.id === id) {
				alert("You played " + card.type);
				console.log(card.type + " card was flicked");
			}
		});
		setAboutPlayer({
			...aboutPlayer,
			cards: aboutPlayer.cards.filter((val) => val.id !== id),
		});
	};

	// useEffect(()=>{
	// 	console.log(aboutPlayer)
	// },[aboutPlayer])

	return (
		<div className="App">
			<header className="App-header">
				<h2>Hi my client Id is {clientId}</h2>
				<h3>Room - {gameId}</h3>

				<input
					onChange={(e) =>
						setAboutPlayer({ ...aboutPlayer, name: e.target.value })
					}
					id="nameInput"
					type="text"
					placeholder="Enter your name here"
					value={aboutPlayer.name}
				/>
				<input
					onChange={(e) => setGameId(e.target.value)}
					id="gameIdInput"
					type="text"
					placeholder="Enter your gameId here"
					value={gameId}
				/>
				<button onClick={makeGame}>Make New Game</button>
				<button onClick={joinGame}>Join Game</button>

				<h2>Current Players in Room :-</h2>
				{gameState &&
					gameState.players.map((player) => {
						return (
							<div key={player.clientId}>
								<h3>{player.name}</h3>
								<p>{player.cards.join()}</p>
							</div>
						);
					})}
			</header>

			<Deck cards={aboutPlayer.cards} throwCard={throwCard}></Deck>

			<div>
				<button
					onClick={() => {
						setAboutPlayer({
							...aboutPlayer,
							cards: [
								...aboutPlayer.cards,
								{
									type: "x4",
									id: uuid(),
								},
							],
						});
					}}
				>
					Add card
				</button>
			</div>
		</div>
	);
}

export default App;
