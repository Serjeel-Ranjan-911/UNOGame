// function to enter full screen
export const enterFullScreen = () => {
	var el = document.body;
	var requestMethod =
		el.requestFullScreen ||
		el.webkitRequestFullScreen ||
		el.mozRequestFullScreen ||
		el.msRequestFullScreen;
	requestMethod.call(el);
};

// function to randomly shuffle an array
export const randomShuffler = (arr) => {
	//function to shuffle arr array
	for (var i = arr.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}
	return arr;
};

// color codes for background
export const colorCodes = {
	r: "#ff6f6f33",
	y: "#ffd00033",
	b: "#6266db33",
	g: "#68ff1c33",
};
