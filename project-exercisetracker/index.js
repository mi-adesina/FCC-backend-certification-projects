require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
// Connect to MongoDB
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
	});

const exerciseTrackerSchema = new mongoose.Schema({
	username: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: Date, default: Date.now },
});
let Exercise = mongoose.model("Exercise", exerciseTrackerSchema);

const userShema = new mongoose.Schema({
	username: { type: String, required: true },
});
const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: true }));

app.post("/api/users", (req, res) => {
	const { username } = req.body;

	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}

	const newUser = new User({ username });

	newUser
		.save()
		.then((user) => {
			res.json({ username: user.username, _id: user._id });
		})
		.catch((err) => {
			if (err.code === 11000) {
				// Duplicate username
				return res.status(400).json({ error: "Username already exists" });
			}
			console.error(err);
			res.status(500).json({ error: "Server error while creating user" });
		});
});


const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
