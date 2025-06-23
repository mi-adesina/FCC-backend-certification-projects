// Load environment variables from .env file
require("dotenv").config();

// Import required modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");

const app = express();

// Connect to MongoDB using Mongoose
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB connection error:", err));

// Define a Mongoose schema for storing URLs
const urlSchema = new mongoose.Schema({
	original_url: { type: String, required: true },
	short_url: { type: Number, required: true },
});

// Create a Mongoose model from the schema
const Url = mongoose.model("Url", urlSchema);

// Set the port (use env or default to 3000)
const port = process.env.PORT || 3000;

// Enable CORS for cross-origin requests
app.use(cors());

// Serve static files from /public folder
app.use("/public", express.static(`${process.cwd()}/public`));

// Serve the index.html file on the root route
app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Test API endpoint
app.get("/api/hello", function (req, res) {
	res.json({ greeting: "hello API" });
});

// Handle POST requests to shorten a URL
app.post(
	"/api/shorturl",
	express.urlencoded({ extended: true }), // Middleware to parse URL-encoded bodies
	async function (req, res) {
		const url = req.body.url;

		// Check if URL is missing
		if (!url) {
			return res.json({ error: "invalid url" });
		}

		// Ensure URL starts with http:// or https://
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			return res.json({ error: "invalid url" });
		}

		// Extract hostname from the URL
		let hostname;
		try {
			hostname = new URL(url).hostname;
		} catch (e) {
			return res.json({ error: "invalid url" });
		}

		// Perform DNS lookup to verify the hostname exists
		dns.lookup(hostname, async (err, address) => {
			if (err || !address) {
				return res.json({ error: "invalid url" });
			}

			// Check if URL already exists in the database
			const urlExists = await Url.findOne({ original_url: url });
			if (urlExists) {
				return res.json({
					original_url: url,
					short_url: urlExists.short_url,
				});
			}

			try {
				// Count documents to generate a short URL ID
				const shortUrlCount = await Url.countDocuments();

				// Create a new URL document
				const newUrl = new Url({
					original_url: url,
					short_url: shortUrlCount + 1,
				});

				// Save the new URL document to the database
				await newUrl.save();

				// Return the shortened URL info
				res.json({
					original_url: newUrl.original_url,
					short_url: newUrl.short_url,
				});
			} catch (err) {
				console.error("Error saving URL:", err);
				return res.json({ error: "Error saving URL" });
			}
		});
	}
);

// Handle GET requests to redirect short URLs
app.get("/api/shorturl/:short_url", async function (req, res) {
	const shortUrl = req.params.short_url;

	try {
		// Look up the original URL by short URL number
		const urlEntry = await Url.findOne({ short_url: Number(shortUrl) });

		if (!urlEntry) {
			return res.json({ error: "No short URL found for the given input" });
		}

		// Redirect to the original URL
		res.redirect(urlEntry.original_url);
	} catch (err) {
		res.json({ error: "Error retrieving URL" });
	}
});

// Start the server
app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
