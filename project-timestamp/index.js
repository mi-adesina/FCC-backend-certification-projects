// index.js
// where your node app starts

// init project
var express = require("express");
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
	res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/:date?", function (req, res) {
  let dateString = req.params.date || req.query.date;
  // If no date is provided, use the current date
  if (!dateString) {
    dateString = Date.now(); // Use current timestamp if no date is provided
  }

  // If no date is provided, return the current date
	let date;

	// Check if the date is in milliseconds (Unix timestamp)
	if (!isNaN(dateString)) {
		date = new Date(parseInt(dateString));
	} else {
		// Try to parse the date string
		date = new Date(dateString);
	}

	// If the date is invalid, return an error
	if (isNaN(date.getTime())) {
		return res.json({ error: "Invalid Date" });
	}

	// Return the date in both formats
	res.json({
		unix: date.getTime(),
		utc: date.toUTCString(),
	});
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
	res.json({ greeting: "hello API" });
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
	console.log("Your app is listening on port " + listener.address().port);
});
