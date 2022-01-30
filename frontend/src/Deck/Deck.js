import style from "./Deck.module.scss";
import { useEffect, useState } from "react";
import { Slider } from "antd";
import { Button } from "antd";

const defaultLeftAngle = -15;
const defaultRightAngle = 50;

const Deck = (props) => {
	const [angleGap, setAngleGap] = useState(2);

	const [angleSpread, setAngleSpread] = useState({
		left: defaultLeftAngle,
		right: defaultRightAngle,
	});
	const [spreadSliderValue, setSpreadSliderValue] = useState(0);
	const [toggleShowCard, setToggleShowCard] = useState(false);
	const [selectedCard, setSelectedCard] = useState({
		type: "",
		idx: -1,
	});

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
			<div className={style.container}>
				<div className={style.deck}>
					{props.cards &&
						props.cards.map((card, idx) => (
							<div
								style={{
									transform: `translate(-50%, -50%) rotate(${parseInt(
										angleSpread.left + idx * angleGap
									)}deg)`,
								}}
								className={style.cardBox}
								id={card}
								onClick={(e) => {
									console.log(e.currentTarget.id);
									if (selectedCard.idx !== idx)
										setSelectedCard({ type: e.currentTarget.id, idx });
									else setSelectedCard({ type: "", idx: -1 });
								}}
							>
								<img
									id="card"
									className={[
										style.card,
										toggleShowCard ? style.flip : "",
										selectedCard.idx === idx ? style.selected : "",
									].join(" ")}
									// src={(toggleShowCard?`/cards/Basic/back.svg`:`/cards/Basic/${card}.svg`)}
									src={`/cards/Basic/${card}.svg`}
									alt={card}
								/>
							</div>
						))}
				</div>

				<div className={style.slider}>
					<Slider
						min={-25}
						max={25}
						// step={1}
						value={spreadSliderValue}
						onChange={(value) => setSpreadSliderValue(value)}
						// onAfterChange={(value) => {
						// 	setAngleSpread({
						// 		left: defaultLeftAngle - value,
						// 		right: defaultRightAngle + value,
						// 	});
						// }}
					/>
				</div>

				<Button
					type="primary"
					onClick={() => {
						//unselect the cards before hiding them
						setSelectedCard({ type: "", idx: -1 });
						setTimeout(() => setToggleShowCard(!toggleShowCard), 1000);
					}}
				>
					{toggleShowCard ? "Show Cards" : "Hide Cards"}
				</Button>
			</div>
		</>
	);
};

export default Deck;
