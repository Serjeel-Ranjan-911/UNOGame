import style from "./Deck.module.scss";
import { useEffect, useState } from "react";
import { Slider, Button } from "antd";

import { useSprings, animated, interpolate } from "react-spring";
import { useGesture } from "react-use-gesture";

const defaultLeftAngle = -15;
const defaultRightAngle = 50;

// animators
const to = (i) => ({
	x: 0,
	y: i * -4,
	rot: -10 + Math.random() * 20,
});
const from = (i) => ({ x: 0, y: -1000, rot: 0 });

var cardUnderProcess = ""; //global variable to store the id of card under process
const numberOfCardsInoneHand = 7;

const Deck = (props) => {
	//angle gap between the cards
	const [angleGap, setAngleGap] = useState(2);
	//maximum angle that card can go left and right
	const [angleSpread, setAngleSpread] = useState({
		left: defaultLeftAngle,
		right: defaultRightAngle,
	});
	//input from slider
	const [spreadSliderValue, setSpreadSliderValue] = useState(0);
	const [toggleShowCard, setToggleShowCard] = useState(false);

	// for gestures
	const [springCards, setSpringCards] = useSprings(props.cards.length, (i) => ({
		...to(i),
		from: from(i),
		delay: i * 100 + 500,
	}));
	const bind = useGesture(
		({ args: [id], down, delta: [xDelta], direction, velocity }) => {
			//check if card was thrown with sufficient velocity
			const trigger = velocity > 0.2;

			//conditions to throw a card
			if (cardUnderProcess === "" && !down && trigger) cardUnderProcess = id;

			setSpringCards((i) => {
				if (id !== props.cards[i].id) {
					return;
				}

				if (cardUnderProcess === id) {
					//try to throw card here
					setTimeout(() => {
						if (props.throwCard(cardUnderProcess)) {
							//throw was successfull

							// find the div throw which card was thrown
							let temp = -1;
							for (let i = 0; i < props.cards.length; i++) {
								if (props.cards[i].id === cardUnderProcess) {
									temp = i;
									break;
								}
							}
							if (temp !== -1) {
								//hide this div before calling it back to position
								document.getElementById("cardIdx" + temp).style.transition =
									"opacity 0s";
								document.getElementById("cardIdx" + temp).style.opacity = 0;
								setSpringCards((i) => to(i)); //bring the card div back to view

								setTimeout(() => {
									document.getElementById("cardIdx" + temp).style.transition =
										"opacity 0.5s";
									document.getElementById("cardIdx" + temp).style.opacity = 1;
								}, 1500);
							}
						} else {
							//throw was unsuccessfull

							setSpringCards((i) => to(i)); //bring the card div back to view
						}
						cardUnderProcess = "";
					}, 1000); //wait sometime for card to process
				}

				// positional arguements
				return {
					y:
						cardUnderProcess === id
							? (200 + window.innerHeight) * -1
							: down
							? -1 * xDelta
							: 0,
					config: {
						friction: 50,
						tension: down ? 800 : cardUnderProcess === id ? 200 : 500,
					},
				};
			});

			if (!down && id !== cardUnderProcess)
				setTimeout(() => setSpringCards((i) => to(i)), 600);
		}
	);

	useEffect(() => {
		if (props.cards.length > 1)
			setAngleGap(
				parseFloat(
					(
						(angleSpread.right - angleSpread.left) /
						(numberOfCardsInoneHand - 1)
					).toFixed(2)
				)
			);
	}, [props.cards, angleSpread]);

	useEffect(() => {
		setAngleSpread({
			left: defaultLeftAngle - spreadSliderValue,
			right: defaultRightAngle + spreadSliderValue,
		});
	}, [spreadSliderValue]);

	useEffect(() => {
		setTimeout(() => {
			if (toggleShowCard)
				document.querySelectorAll("#card").forEach((card) => {
					card.src = "/cards/Basic/back.svg";
				});
			else {
				document.querySelectorAll("#card").forEach((card) => {
					card.src = `/cards/Basic/${card.getAttribute("alt")}.svg`;
				});
			}
		}, 300);
	}, [toggleShowCard]);

	return (
		<>
			<div className={style.cardsContainer}>
				{props.cards &&
					springCards.map(({ x, y, rot }, i) => (
						<animated.div
							id={props.cards[i].id}
							key={props.cards[i].id}
							style={{
								transform: interpolate(
									[x, y],
									(x, y) => `translate3d(${x}px,${y}px,0)`
								),
							}}
							className={style.outerAnimatedDiv}
						>
							<animated.div
								{...bind(props.cards[i].id)}
								className={style.innerAnimatedDiv}
							>
								<div
									id={"cardIdx" + i}
									style={{
										transformOrigin: "bottom center",
										transform: `rotate(${(
											angleSpread.left +
											(i % numberOfCardsInoneHand) * angleGap
										).toFixed(2)}deg) translateY(${
											6 * parseInt(i / numberOfCardsInoneHand)
										}rem)`,
									}}
									className={style.cardBox}
								>
									<img
										id="card"
										className={[
											style.card,
											toggleShowCard ? style.flip : "",
										].join(" ")}
										src={`/cards/Basic/${props.cards[i].type}.svg`}
										alt={props.cards[i].type}
									/>
								</div>
							</animated.div>
						</animated.div>
					))}

				<img
					className={style.avatarIcon}
					src={`/avatars/${props.idx}.jpeg`}
					alt="player avatar"
				/>
			</div>

			<div className={style.playButtons}>
				<Button
					ghost
					type="primary"
					onClick={() => {
						setToggleShowCard(!toggleShowCard);
					}}
				>
					{toggleShowCard ? "Show Cards" : "Hide Cards"}
				</Button>

				<Button ghost type="primary" onClick={props.drawACard}>
					Pick Card
				</Button>

				<Button
					ghost
					type="primary"
					onClick={() => {
						setToggleShowCard(true); //hide cards first
						setTimeout(() => {
							props.shuffle();
							setToggleShowCard(false); //show cards again
						}, 1000);
					}}
				>
					Shuffle
				</Button>
			</div>

			<div className={style.slider}>
				<Slider
					tooltipVisible={false}
					min={-25}
					max={25}
					value={spreadSliderValue}
					onChange={(value) => setSpreadSliderValue(value)}
				/>
			</div>
		</>
	);
};

export default Deck;
