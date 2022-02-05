import style from "./Stack.module.scss";

const Stack = (props)=>{
    return (
        <div className={style.stack}>
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(6px)`}}  className={style.stackCard}  src="/cards/planewhite.svg" />
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(9px)`}}  className={style.stackCard}  src="/cards/planewhite.svg" />
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(12px)`}} className={style.stackCard} src="/cards/planewhite.svg" />
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(15px)`}} className={style.stackCard} src="/cards/planewhite.svg" />
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(18px)`}} className={style.stackCard} src="/cards/planewhite.svg" />
            <img style={{transform: `rotateX(60deg) rotateY(0deg) rotateZ(-45deg) translateZ(21px)`}} className={style.stackCard} src={`/cards/Basic/${props.topcard}.svg`}/>
        </div>
    )
}

export default Stack;