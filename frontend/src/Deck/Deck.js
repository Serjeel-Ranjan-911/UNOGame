import style from "./Deck.module.scss";
import { useEffect, useState } from "react";

const Deck = (props) => {
	const [angleGap, setAngleGap] = useState(2);
	const [left,setLeft] = useState(-15);
	const [right,setRight] = useState(50);

	useEffect(() => {
		if (props.cards.length > 1) setAngleGap((right-left) / (props.cards.length - 1));
	}, [props.cards, left, right]);

	useEffect(() => {
		console.log(angleGap);
	}, [angleGap]);

	return (
		<div className={style.container}>
			<div className={style.deck}>
				{props.cards &&
					props.cards.map((card, idx) => (
						<div
							style={{
								transform: `translate(-50%, -50%) rotate(${
									left + idx * angleGap
								}deg)`,
							}}
							className={style.cardBox}
						>
							<img
								className={style.card}
								src={`/cards/Basic/${card}.svg`}
								alt="card"
							/>
						</div>
					))}
			</div>
		</div>
	);
};

export default Deck;
