## Socket request and responses

---

- Client Joins the server

Player is assigned an ID when socket connection is created as he visits the page

Request

```json
{}
```

Response

Emit "welcome" event from the client

```json
{
    clientId: <guid>
}
```

---

- Making a new Game

Request

Emit "makeGame" event from client

```json
{
    clientId: <guid>
}
```

Response

Emit "makeGame" event from Server

```json
{
    game: {
        id: <guid>,
        //rest of information about game
    }
}
```

---

- A player joining a game (triggers broadcast)

Request

Emit "joinGame" event from client

```json
{
    clientId: <guid>,
    gameId: <guid>
}
```

Response

```json
{}
```

---

- Play a card/Play cards (triggers broadcast)

Request

Emit "play" event from client
```json
{
    method: "play",
    clientId: <guid>,
    gameId: <guid>,
    cards: [<cards played by player>]    
}
```

Response

```json
{}
```

---

- Card representation in Game

Each card in game is represented using two letters. First letter represent color and second one number.

Special cards have first letter as "x" representing no color

```json
[
	"r1","r2","r3","r4","r5","r6","r7","r8","r9","rs","rr","rp",
    "g1","g2","g3","g4","g5","g6","g7","g8","g9","gs","gr","gp",
	"b1","b2","b3","b4","b5","b6","b7","b8","b9","bs","br","bp",
	"y1","y2","y3","y4","y5","y6","y7","y8","y9","ys","yr","yp",
	"xc","x4"
]
```

---

- Game State

This state is maintained for each room on server

```json
{
    owner: <clientId of game creater>,
    playerTurn: <clientId of player whose turn is next>,
    currentActive: {
        color: <current playable color>,
        number: <current playable number>
    },
    deckStack: [
        <remaining cards>
    ]
    ,
    players: [
        {
            clientId: <id of client>
            name: <name of client>
            cards: [<all cards owned by this client>]
        }
    ]
}
```

Other than Game state this extra data is also maintained

**socketIdToClientId**

This maps each socketId to their respective client ID

**clientIdToRoomId**

This maps each client Id to their respective room ID

---

- Broadcast State

This state is broadcasted to each player on

```json
{
	// almost same as game state for simplicity
}
```
