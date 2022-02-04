import style from "./Room.module.scss";

const Room = (props) => {
	return props.players.map((player, idx) => (
		<div className={style.container}>
			<div
				className={`${style.singlePlayer} ${
					idx % 2 === 0 ? style.stickLeft : style.stickRight
				} ${props.currentTurn === player.clientId ? style.currentTurn : ""}`}
			>
				<p key={player.clientId}>{player.cards.length}</p>
				<img className={style.playerIcon} src={`/avatars/${idx}.jpeg`} />
			</div>
		</div>
	));
};

export default Room;
