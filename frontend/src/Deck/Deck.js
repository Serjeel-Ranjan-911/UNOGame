import style from "./Deck.module.scss";
import { useEffect, useState } from "react";
import { Slider } from "antd";
import { Button } from "antd";

// import { useSpring, animated } from "@react-spring/web";
// import { useDrag } from "@use-gesture/react";

import { useSprings, animated, interpolate } from "react-spring";
import { useGesture } from "react-use-gesture";

const defaultLeftAngle = -15;
const defaultRightAngle = 50;

// animators
const to = (i) => ({
	x: 0,
	y: i * -4,
});
const from = (i) => ({ x: 0, y: -1000 });

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
	const [selectedCard, setSelectedCard] = useState({
		type: "",
		idx: -1,
	});

	// testing
	const [gone] = useState(() => new Set());
	const [springCards, setSpringCards] = useSprings(props.cards.length, (i) => ({
		...to(i),
		from: from(i),
		delay: i * 100 + 500,
	}));
	const bind = useGesture(
		({ args: [id], down, delta: [xDelta], direction, velocity }) => {
			//check if card was thrown with sufficient velocity
			const trigger = velocity > 0.2;

			if (!down && trigger) gone.add(id);
			setSpringCards((i) => {
				if (id !== props.cards[i].id) return;
				const isGone = gone.has(props.cards[i].id);
				if (isGone) {
					//code if card was thrown successfully
					setTimeout(()=>{
						props.throwCard(props.cards[i].id);
						setSpringCards(i=>to(i))
					},1000);
				}
				const y = isGone
					? (200 + window.innerHeight) * -1
					: down
					? -1 * xDelta
					: 0;
				return {
					y,
					config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
				};
			});
		}
	);

	useEffect(() => {
		if (props.cards.length > 1)
			setAngleGap(
				parseInt(
					(angleSpread.right - angleSpread.left) / (props.cards.length - 1)
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
			<Button
				type="primary"
				onClick={() => {
					//unselect the cards before hiding them
					setSelectedCard({ type: "", idx: -1 });
					setToggleShowCard(!toggleShowCard);
					// setTimeout(() => setToggleShowCard(!toggleShowCard), 1000);
				}}
			>
				{toggleShowCard ? "Show Cards" : "Hide Cards"}
			</Button>

			<div
				style={{
					width: "100vw",
					backgroundColor: "pink",
				}}
			>
				{props.cards &&
					springCards.map(({ x, y }, i) => (
						<animated.div
							id={props.cards[i].id}
							key={props.cards[i].id}
							style={{
								transform: interpolate(
									[x, y],
									(x, y) => `translate3d(${x}px,${y}px,0)`
								),
							}}
						>
							<animated.div
								{...bind(props.cards[i].id)}
								style={{ transform: "translate(-38%,-50%)" }}
							>
								<div
									style={{
										transformOrigin: "bottom center",
										transform: `rotate(${parseInt(
											angleSpread.left + i * angleGap
										)}deg)`,
									}}
									className={style.cardBox}
									// id={props.cards[i]}
									// onClick={(e) => {
									// 	console.log(e.currentTarget.id);
									// 	if (selectedCard.idx !== i)
									// 		setSelectedCard({ type: e.currentTarget.id, idx: i });
									// 	else setSelectedCard({ type: "", idx: -1 });
									// }}
								>
									<img
										id="card"
										className={[
											style.card,
											toggleShowCard ? style.flip : "",
											// selectedCard.idx === idx ? style.selected : "",
										].join(" ")}
										// src={(toggleShowCard?`/cards/Basic/back.svg`:`/cards/Basic/${card}.svg`)}
										src={`/cards/Basic/${props.cards[i].type}.svg`}
										alt={props.cards[i].type}
									/>
								</div>
							</animated.div>
						</animated.div>
					))}
			</div>
			<div className={style.slider}>
				<Slider
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
