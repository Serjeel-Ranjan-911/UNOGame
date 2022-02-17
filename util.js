export const shuffle = (cards) => {
	//function to shuffle cards array
	for (var i = cards.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = cards[i];
		cards[i] = cards[j];
		cards[j] = temp;
	}
};