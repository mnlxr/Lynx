require("dotenv").config("../../../.env");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const path = require("path");
const getLink = require("./db/modules/link/get");
const backend = require("./modules/backend")

const mongoose = require("mongoose");
const setup = require("./modules/setup");

let undefinedEnv = ["DB_USER", "DB_PASSWORD", "DB_HOST", "JWT_KEY", "URL_SET", "URL_ONLY_UNIQUE", "URL_LENGTH"].filter(
	(envFile) => !process.env.hasOwnProperty(envFile)
);

if (undefinedEnv.length > 0) {
	throw new Error(`Required env variables were not provided: ${undefinedEnv.join(",")}`);
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(mongoSanitize({ allowDots: true }));

app.use("/api", require("./api"));

app.get("/", (req, res) => {
	res.redirect(process.env.HOME_REDIRECT || "/dash/overview");
});

if (process.env.NODE_ENV === "production") {
	app.use(express.static("dist"));

	app.get("/dash/*", (req, res) => {
		res.sendFile(path.resolve("dist", "index.html"));
	});

	app.get("*", async (req, res) => {
		const slug = req.originalUrl.slice(1);
		const link = await getLink({ slug }, null, true);
		if (link && process.env.FORCE_FRONTEND_REDIRECT !== "true") {
			res.redirect(302, link.destination);
		} else {
			res.sendFile(path.resolve("dist", "index.html"));
		}
	});
}

const mongoDB = `mongodb://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${
	process.env.DB_PORT
}/shortener?authSource=admin`;

mongoose.set("strictQuery", false);

mongoose
	.connect(mongoDB, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("Connected to database");
		const listenPort = process.env.EXPRESS_PORT || 3000;
		setup().then(() => {
			app.listen(listenPort, async () => {
				console.log(`Listening on port ${listenPort}`);
				backend.start()
			});
		});
	})
	.catch((error) => {
		console.log("Couldn't connect to database!");
		console.log(error);
	});
