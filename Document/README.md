## Card representation in Game

Each card in game is represented using two letters. First letter represent color and second one number.

Action cards have first letter as "x" representing no color

```
[
	"r1","r2","r3","r4","r5","r6","r7","r8","r9","rs","rr","rp",
    "g1","g2","g3","g4","g5","g6","g7","g8","g9","gs","gr","gp",
	"b1","b2","b3","b4","b5","b6","b7","b8","b9","bs","br","bp",
	"y1","y2","y3","y4","y5","y6","y7","y8","y9","ys","yr","yp",
	"xc","x4"
]
```

---

## Game State

Three maps/objects are maintained on server

    state
    socketIdToClientId
    clientIdToRoomId

- state

This stores the data about each game mapped to a roomId

- socketIdToClientId

This stores value mapped from socket Id to their client Id

- clientIdToRoomId

This stores value mapped from client Id to their respective room Id

---
## Single Game

For single game the following data is maintained

```
{
    owner: //id of the owner,
    players: [
        {
            clientId: //client id of this player,
            name: // name of this player,
            cards: // cards owned by this player,
        },
    ],
    deckStack: //array of cards available in deck,
    currentTurn: {
        name: //name of player who should move next,
        clientId: // it's client id,
    },
    stackTop: {
        type: //type of card on top of stack,
        color: //color of card on top of stack,
        number: //number of card on top of stack,
    },
    dir: //direction of play,
    countOfCardsToPick: //number of card to pick,
    activePlus2: //boolean to know if +2 card is supposed to be thrown,
    activePlus4: //boolean to know if +4 card is supposed to be thrown,
}
```

Currently for simplicity the same state is broadcasted to each player

---
## Socket Events

### Client Side Events

- connect

Fires when a successfull socket connection is made

- welcome 

Fired when server assigns a id to this socket connection

**data expected**
```
{
    clientId: //id assigned by the server
}
```

- toast

Fired when server wants to show a toast message on UI

**data expected**
```
{
    status: //boolean,
    message: //text message
}

```
- stateUpdate

Fires when server wants to update the client UI state

**data expected**

Total game state object
- makeGame

Fires when server creates a new game

**data expected**

```
{
    gameId: //id of the game room
}
```

- chooseColor

Fires when server wants client to choose a new color

- ENDGAME

Fires when any player has won

**data expected**
```
{
    winner: //name of the winner
}
```
### Server Side Events

- makeGame

Fired when a client wants to create a new game

**data expected**
```
{
    clientId: //id of client,
    name: //name of the client
}
```

- joinGame

Fired when a client wants to join a game

**data expected**
```
{
    clientId: //id of client,
    gameId: //id of game he wants to join,
    name: //name of the client
}
```

- playCard

Fired when a player throws a card

**data expected**
```
{
    card: {
        type: //type of card,
        color: //color of card,
        number: //number of card
    }
}
```

- setColor

Fired when a client wants to change color of game

**data expected**
```
{
    color: //chosen color
}
```

- drawCard

Fired when a client wants to pick a card

- disconnecting

Fired when a client has disconnected from the server