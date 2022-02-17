import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import uuid from "react-uuid";
import { isDesktop } from "react-device-detect";
import { Input, Button, Modal } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { enterFullScreen, randomShuffler, colorCodes } from "./util.js";

import Deck from "./Deck/Deck.js";
import Room from "./Room/Room.js";
import Stack from "./Stack/Stack.js";

function App() {
	const [clientId, setClientId] = useState(null); //user id given to player by server
	const [gameId, setGameId] = useState(""); // game id the player is in
	const [socket, setSocket] = useState(null); // socket connection
	const [gameState, setGameState] = useState({
		// full state of the game
		owner: "",
		players: [],
		deckState: [],
		currentTurn: {
			name: "",
			clientId: "",
		},
		stackTop: {
			type: "",
			color: "",
			number: "",
		},
		dir: 0,
	});

	const [aboutPlayer, setAboutPlayer] = useState({
		//store information about single player
		name: "",
		cards: [],
		idx: -1,
	}); //data shown in UI
	const [isModalVisible, setIsModalVisible] = useState(true); // modal for new game / join game

	const [isColorChangeModalVisible, setIsColorChangeModalVisible] =
		useState(false); //modal for color change
	const [selectedColor, setSelectedColor] = useState("x");

	const [inGame, setInGame] = useState(false);
	const [shareableUrl, setShareableUrl] = useState(null);
	const [orientationToggle, setOrientationToggle] = useState(false);

	//effect for page load
	useEffect(() => {
		// open a new socket connection with server
		const newSocket = io(
			`${
				process.env.REACT_APP_LOCAL_BACKEND_URL
					? process.env.REACT_APP_LOCAL_BACKEND_URL
					: ""
			}/`
		);

		setSocket(newSocket);
		//try to get room id from url
		const query = new URLSearchParams(window.location.search);
		const roomId = query.get("roomId");
		if (roomId) {
			setGameId(roomId);
		}

		//checking if device is in portraint mode
		window.addEventListener("orientationchange", function () {
			if (window.orientation === -90 || window.orientation === 90)
				setOrientationToggle(true);
			else setOrientationToggle(false);
		});

		//function that give reload warning
		const handleBeforeUnload = (e) => {
			e.preventDefault();
			e.returnValue = "reloading will throw you out of game";
			return "reloading will throw you out of game";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	//effect for socket connection
	//setting all events here
	useEffect(() => {
		if (!socket) return;

		socket.on("connect", () => {
			toast("Connected to the Server 🤟!!!");
		});

		socket.on("welcome", (res) => {
			setClientId(res.clientId);
		});

		socket.on("toast", (res) => {
			if (res.status) {
				toast.success(res.message);
			} else {
				toast.warn(res.message);
			}
		});

		socket.on("stateUpdate", (res) => {
			setInGame(true);
			setGameState(res);
		});

		socket.on("makeGame", (res) => {
			setShareableUrl(window.location.href + "?roomId=" + res.gameId);
			setGameId(res.gameId);
		});

		socket.on("chooseColor", () => {
			setIsColorChangeModalVisible(true);
		});

		socket.on("ENDGAME", (res) => {
			toast("🎉🎊" + res.winner + " won the game 🎊🎉", {
				position: "top-center",
				autoClose: 60000,
				closeOnClick: true,
				pauseOnHover: true,
			});
		});
	}, [socket]);

	//effect for game state update
	useEffect(() => {
		if (!gameState) return;

		// set details about our current player
		// each player card is given uuid for UI purpose
		for (let i = 0; i < gameState.players.length; i++) {
			if (gameState.players[i].clientId === clientId) {
				setAboutPlayer({
					...aboutPlayer,
					cards: gameState.players[i].cards.map((card) => ({
						type: card,
						id: uuid(),
					})),
					idx: i,
				});
			}
		}
	}, [gameState]);

	useEffect(() => {
		const colorMap = {
			r: "Red",
			g: "Green",
			b: "Blue",
			y: "Yellow",
		};
		if (selectedColor !== "x")
			toast.success(`${colorMap[selectedColor]} is selected`);
	}, [selectedColor]);

	const makeGame = () => {
		if (!aboutPlayer.name || aboutPlayer.name.length < 3) {
			toast.warn("Please enter a valid name !");
			return;
		}

		socket.emit("makeGame", {
			name: aboutPlayer.name,
			clientId: clientId,
		});
	};

	const joinGame = () => {
		if (!aboutPlayer.name || aboutPlayer.name.length < 3) {
			toast.warn("Please enter a valid name!");
			return;
		}

		if (!gameId || gameId.length !== 36) {
			toast.warn("Please enter a valid Game ID!");
			return;
		}

		socket.emit("joinGame", {
			clientId: clientId,
			name: aboutPlayer.name,
			gameId: gameId,
		});
	};

	//function to throw a card
	const throwCard = (id) => {
		//client side check for an invalid player throw
		if (clientId !== gameState.currentTurn.clientId) {
			toast.warn("Not your turn !");
			return false;
		}

		//identify the type of card
		let type = null;
		aboutPlayer.cards.forEach((card) => {
			if (card.id === id) {
				type = card.type;
			}
		});
		// client side check of an invalid card throw
		if (!type) return false;

		// (check if card is action card or of valid color or number)
		if (
			!(gameState.stackTop.type === "none" || //check if it's start of the game
				type[0] === "x" ||
				type[0] === gameState.stackTop.color ||
				type[1] === gameState.stackTop.number
			)
		) {
			toast.warn(`Can't throw this card !`);
			return false;
		}

		//if card is valid then send it to server
		socket.emit("playCard", {
			clientId: clientId,
			card: {
				color: type[0],
				number: type[1],
				type: type,
			},
		});

		return true;
	};

	//function to pick a card
	const drawACard = () => {
		socket.emit("drawCard", { numberOfCardsToDraw: 1 });
	};

	//shuffle cards in hand
	const shuffle = () => {
		setAboutPlayer({
			...aboutPlayer,
			cards: randomShuffler([...aboutPlayer.cards]),
		});
	};

	// can't play on desktop right now 😞
	if (isDesktop) {
		return (
			<div className="App">
				<div className="Container">
					<p className="title">Under development for desktops :(</p>
					<p className="title">Enjoy on your phone</p>
					<img className="brokenRobo" src="./robo.png" alt="broken robo" />
				</div>
			</div>
		);
	}

	// UI designed to be played in portrait mode
	if (orientationToggle) {
		return (
			<div className="App">
				<div className="Container">
					<p className="title">Please play in portrait mode :(</p>
					<img className="brokenRobo" src="./robo.png" alt="broken robo" />
				</div>
			</div>
		);
	}

	return (
		<div
			className="App"
			style={{ backgroundColor: colorCodes[gameState.stackTop.color] }}
		>
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
					if (!inGame) {
						toast.warn("Please make a game or join one !");
					} else {
						setIsModalVisible(false);
						enterFullScreen();
					}
				}}
				onCancel={() => {
					if (!inGame) {
						toast.warn("Please make a game or join one !");
					} else {
						setIsModalVisible(false);
						enterFullScreen();
					}
				}}
			>
				<div className="modalWrapper">
					<img className="logo" src="/logo192.png" alt="logo" />
				</div>
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

				{/* show the url if user created the game */}
				{shareableUrl ? (
					<>
						<p className="modalText">Share this game ID:-</p>
						<p className="modalText modalHighlightText">{gameId}</p>
						<p className="modalText">Or share this URL with friends:-</p>
						<a
							className="modalHighlightText"
							href={shareableUrl}
							target="_blank"
						>
							{shareableUrl}
						</a>
					</>
				) : null}

				{/* once user get in game he should close the modal */}
				{inGame ? (
					<p className="modalText" style={{ marginTop: "1rem" }}>
						Click <b>OK</b> to proceed
					</p>
				) : null}
			</Modal>

			{/* This modal is for choosing color */}
			<Modal
				title="Choose a color"
				visible={isColorChangeModalVisible}
				closable={false}
				onOk={() => {
					socket.emit("setColor", {
						color: selectedColor !== "x" ? selectedColor : "r", //default
					});
					setIsColorChangeModalVisible(false);
				}}
				onCancel={() => {
					socket.emit("setColor", {
						color: selectedColor !== "x" ? selectedColor : "r", //default
					});
					setIsColorChangeModalVisible(false);
				}}
			>
				<div className="modalWrapper">
					<div
						onClick={() => setSelectedColor("r")}
						style={{ backgroundColor: "red" }}
						className="colorPick"
					></div>
					<div
						onClick={() => setSelectedColor("b")}
						style={{ backgroundColor: "blue" }}
						className="colorPick"
					></div>
					<div
						onClick={() => setSelectedColor("g")}
						style={{ backgroundColor: "green" }}
						className="colorPick"
					></div>
					<div
						onClick={() => setSelectedColor("y")}
						style={{ backgroundColor: "yellow" }}
						className="colorPick"
					></div>
				</div>
			</Modal>

			{gameState && gameState.currentTurn.name !== "" && (
				<div className="turnNameBox">
					<p>{gameState.currentTurn.name}'s Turn</p>
				</div>
			)}

			{gameState && gameState.stackTop.type && (
				<div className="stackContainer">
					<Stack topcard={gameState.stackTop.type} />
				</div>
			)}

			<div className="roomContainer">
				<Room
					players={gameState.players}
					currentTurn={gameState.currentTurn.clientId}
				></Room>
			</div>

			{/* only display deck if there are some cards */}
			{aboutPlayer.cards.length > 0 && (
				<div className="deckContainer">
					<Deck
						stackTop={gameState.stackTop.type}
						currentTurn={gameState.currentTurn.clientId === clientId}
						idx={aboutPlayer.idx}
						cards={aboutPlayer.cards}
						throwCard={throwCard}
						shuffle={shuffle}
						drawACard={drawACard}
					></Deck>
				</div>
			)}
		</div>
	);
}

export default App;
