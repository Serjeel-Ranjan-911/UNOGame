import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import uuid from "react-uuid";
import { isDesktop } from "react-device-detect";
import { Input, Button, Modal } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Deck from "./Deck/Deck.js";
import Room from "./Room/Room.js";
import Stack from "./Stack/Stack.js";

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
			clientId: "",
		},
		stackTop: {
			type: "",
			color: "",
			number: "",
		},
		dir: 0,
	}); //to store game state coming from server
	const [aboutPlayer, setAboutPlayer] = useState({
		name: "",
		cards: [],
		idx: -1,
	}); //data shown in UI
	const [isModalVisible, setIsModalVisible] = useState(true); // modal for new game / join game
	
	const [isColorChangeModalVisible,setIsColorChangeModalVisible] = useState(false); //modal for color change 
	const [selectedColor,setSelectedColor] = useState("x");

	const [inGame, setInGame] = useState(false);
	const [shareableUrl, setShareableUrl] = useState(null);
	const [orientationToggle, setOrientationToggle] = useState(false);

	useEffect(() => {
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

	useEffect(() => {
		if (!socket) return;
		socket.on("connect", () => {
			//code on connect
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

		socket.on("ENDGAME", (res) => {
			toast("🎉🎊" + res.winner + " won the game 🎊🎉",{
				position: "top-center",
				autoClose: 60000,
				closeOnClick: true,
				pauseOnHover: true,
				});
		});

		socket.on("stateUpdate", (res) => {
			// if server sent us the state this means player is in game
			//no need display modals
			setInGame(true);
			setGameState(res);
		});

		socket.on("makeGame", (res) => {
			console.log(res.gameId);
			setShareableUrl(window.location.href + "?roomId=" + res.gameId);
			setGameId(res.gameId);
		});

		socket.on("chooseColor",(res)=>{
			setIsColorChangeModalVisible(true);
		})
	}, [socket]);

	useEffect(() => {
		console.log(gameState);
		if (!gameState) return;
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

	useEffect(()=>{
		const colorMap = {
			"r":"red",
			"g": "green",
			"b": "blue",
			"y": "yellow"
		}
		if(selectedColor!=="x")
			toast.success(`${colorMap[selectedColor]} is selected`);
	},[selectedColor])

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

	//returns true if server accepted otherwise false
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
		
		//check if it's start of the game
		if(gameState.stackTop.type === "none"){
			socket.emit("playCard", {
				clientId: clientId,
				card: {
					color: type[0],
					number: type[1],
					type: type,
				},
			});
			
			return true;
		}
		
		// (check if card is action card or of valid color or number)
		if (
			!(type[0] === "x" ||
			type[0] === gameState.stackTop.color ||
			type[1] === gameState.stackTop.number)
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

	const drawACard = () => {
		socket.emit("drawCard", { numberOfCardsToDraw: 1 });
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

	const enterFullScreen = () => {
		var el = document.body;
		var requestMethod =
			el.requestFullScreen ||
			el.webkitRequestFullScreen ||
			el.mozRequestFullScreen ||
			el.msRequestFullScreen;
		requestMethod.call(el);
	};

	//shuffle cards in hand
	const shuffle = () => {
		setAboutPlayer({
			...aboutPlayer,
			cards: randomShuffler([...aboutPlayer.cards]),
		});
	};

	// can't play on desktop right now :(
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

	const colorCodes = {
		r: "#ff6f6f33",
		y: "#ffd00033",
		b: "#6266db33",
		g: "#68ff1c33"
	}

	return (
		<div className="App" style={{backgroundColor: colorCodes[gameState.stackTop.color]}}>
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
					if(!inGame){
						toast.warn("Please make a game or join one !");
					}
					else{
						setIsModalVisible(false);
						enterFullScreen();
					}

				}}
				onCancel={() => {
					if(!inGame){
						toast.warn("Please make a game or join one !");
					}
					else{
						setIsModalVisible(false);
						enterFullScreen();
					}
				}}
			>

				<div className="modalWrapper">
					<img className="logo" src="/logo192.png" alt="logo"/>
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
						<a className="modalHighlightText" href={shareableUrl} target="_blank">
							{shareableUrl}
						</a>
					</>
				) : null}

				{/* once user get in game he should close the modal */}
				{inGame ? (
					<p className="modalText" style={{marginTop:"1rem"}}>
						Click <b>OK</b> to proceed
					</p>
				) : null}
			</Modal>


			<Modal
				title="Choose a color"
				visible={isColorChangeModalVisible}
				closable={false}
				onOk={() => {
						socket.emit("setColor",{
							color: selectedColor!=='x'?selectedColor: "r" //default
						})
						setIsColorChangeModalVisible(false);
					}}
					onCancel={() => {
						socket.emit("setColor",{
							color: selectedColor!=='x'?selectedColor: "r" //default
						})
						setIsColorChangeModalVisible(false);
					}}
					>

				<div className="modalWrapper">
					<div onClick={()=>setSelectedColor("r")} style={{backgroundColor: "red"}} className="colorPick"></div>
					<div onClick={()=>setSelectedColor("b")} style={{backgroundColor: "blue"}} className="colorPick"></div>
					<div onClick={()=>setSelectedColor("g")} style={{backgroundColor: "green"}} className="colorPick"></div>
					<div onClick={()=>setSelectedColor("y")} style={{backgroundColor: "yellow"}} className="colorPick"></div>
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
