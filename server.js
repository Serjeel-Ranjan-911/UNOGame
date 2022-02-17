import express from "express";
import path from "path";

// making the express server
const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.static(path.join("react_build")));

export const server = app.listen(PORT, function () {
	console.log(`Listening on port ${PORT}`);
	console.log(`http://localhost:${PORT}`);
});

