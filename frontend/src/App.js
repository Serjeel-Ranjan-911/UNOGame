import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import uuid from "react-uuid";
import { Input, Button, Modal } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Deck from "./Deck/Deck.js";

function App() {
	const [clientId, setClientId] = useState(null);
	const [gameId, setGameId] = useState("");
	const [socket, setSocket] = useState(null);
	const [gameState, setGameState] = useState({
		owner: "",
		players: [],
		deckState: [],
		currentTurn: {
			name: "",
			id: "",
		},
		stackTop: {
			color: "",
			number: "",
		},
	}); //to store game state coming from server
	const [aboutPlayer, setAboutPlayer] = useState({ name: "", cards: [] }); //data shown in UI
	const [isModalVisible, setIsModalVisible] = useState(true);
	const [inGame, setInGame] = useState(false);
	const [shareableUrl, setShareableUrl] = useState(null);

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
			// if server sent us the state this means player is in game
			//no need display modal
			setIsModalVisible(false)
			setInGame(true);
			setGameState(res);
		});

		socket.on("makeGame", (res) => {
			console.log(res.gameId);
			setShareableUrl("Share this Game ID with your friends : " + res.gameId);
			setGameId(res.gameId);
		});
	}, [socket]);

	useEffect(() => {
		console.log(gameState);
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
			toast("Please enter a valid name");
			return;
		}

		socket.emit("makeGame", {
			name: aboutPlayer.name,
			clientId: clientId,
		});
	};

	const joinGame = () => {
		if (!aboutPlayer.name || aboutPlayer.name.length < 3) {
			toast("Please enter a valid name");
			return;
		}

		if (!gameId || gameId.length !== 36) {
			toast("Please enter a valid Game ID");
			return;
		}

		socket.emit("joinGame", {
			clientId: clientId,
			name: aboutPlayer.name,
			gameId: gameId,
		});
	};

	//returns true if server accepted otherwise false
	const throwCard = (id) => {
		//client side check for an invalid player throw
		if (clientId !== gameState.currentTurn.clientId) return false;

		//identify the type of card
		let type = null;
		aboutPlayer.cards.forEach((card) => {
			if (card.id === id) {
				type = card.type;
			}
		});
		// client side check of an invalid card throw
		// (check if card is action card or of valid color or number)
		if (
			type[0] !== "x" &&
			!(
				type[0] === gameState.stackTop.color ||
				type[1] === gameState.stackTop.number
			)
		) {
			toast(`Can't throw this card!!!`);
			return false;
		}

		//trying to replicate server call
		if (Math.random() > 0.5) {
			setAboutPlayer({
				...aboutPlayer,
				cards: aboutPlayer.cards.filter((val) => val.id !== id),
			});
			toast(type + " card was thrown!!!");
			return true;
		} else {
			console.log("0");
			return false;
		}
	};

	//random shuffler utility

	const randomShuffler = (arr) => {
		//function to shuffle arr array
		for (var i = arr.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = arr[i];
			arr[i] = arr[j];
			arr[j] = temp;
		}
		return arr;
	};

	//shuffle cards in hand
	const shuffle = () => {
		setAboutPlayer({
			...aboutPlayer,
			cards: randomShuffler([...aboutPlayer.cards]),
		});
	};

	const drawACard = () => {
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
	};

	// useEffect(()=>{
	// 	console.log(aboutPlayer)
	// },[aboutPlayer])

	return (
		<div className="App">
			{/* This toast is for showing messages to user */}
			<ToastContainer
				position="bottom-center"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={true}
				closeOnClick
			/>

			{/* This modal is for making/joining a game */}
			<Modal
				title="Welcome to the game"
				visible={isModalVisible}
				closable={false}
				onOk={() => {
					setIsModalVisible(false);
				}}
				onCancel={() => {
					setIsModalVisible(false);
				}}
			>
				<div className="modalWrapper">
					<p className="modalText">Your name :</p>
					<Input
						onChange={(e) =>
							setAboutPlayer({ ...aboutPlayer, name: e.target.value })
						}
						id="nameInput"
						type="text"
						placeholder="Enter your name here"
						value={aboutPlayer.name}
					/>
				</div>

				{!inGame && (
					<>
						<p className="modalText">
							Either create a <b>New Game</b> or <b>Join Game</b> with game ID :
						</p>
						<div className="modalWrapper">
							<div style={{ backgroundColor: "#0043ff47" }} className="halfDiv">
								<Input
									onChange={(e) => setGameId(e.target.value)}
									id="gameIdInput"
									type="text"
									placeholder="GameID"
									value={gameId}
								/>
								<Button ghost type="primary" onClick={joinGame}>
									Join Game
								</Button>
							</div>

							<div style={{ backgroundColor: "#ff00003d" }} className="halfDiv">
								<Button ghost type="primary" onClick={makeGame}>
									New Game
								</Button>
							</div>
						</div>
					</>
				)}

				{shareableUrl ? <>
				
				<p className="modalText">{shareableUrl}</p>
				<p className="modalText">Click <b>OK</b> to proceed</p>
				</>
				 : null}
			</Modal>

			<header className="App-header">
				{gameState && gameState.currentTurn.name !== "" && (
					<div className="turnNameBox">
						<p>{gameState.currentTurn.name}'s Turn</p>
					</div>
				)}
			</header>

			<div>
				<Deck
					cards={aboutPlayer.cards}
					throwCard={throwCard}
					shuffle={shuffle}
				></Deck>
			</div>

			<div>
				<Button onClick={drawACard}>Pick Card</Button>
			</div>
		</div>
	);
}

export default App;
