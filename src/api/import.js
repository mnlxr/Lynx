const express = require("express");
const multer = require("multer");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const Link = require("../db/models/link");
const { v4: uuid4 } = require("uuid");
const requireLogin = require("./middleware/requireLogin");
const requireFields = require("./middleware/requireFields");
const Account = require("../db/models/account");

let accounts = {};

const upload = multer({ dest: "tmp/uploads/" });

const fields = {
	shlink: ["shortUrl", "longUrl", "createdAt", "visits"],
	lynx: ["id", "slug", "destination", "author", "creationDate", "modifiedDate", "visits"],
	yourls: ["source", "target", "hits"],
};

const processFile = async (path) => {
	records = [];
	const parser = fs.createReadStream(path).pipe(parse({ columns: true, trim: true }));
	for await (const record of parser) {
		// Work with each record
		records.push(record);
	}
	return records;
};

router.post("/", requireLogin, upload.single("file"), requireFields(["service"]), async (req, res) => {
	if (process.env.DEMO === "true")
		return res.status(406).json({
			success: false,
			message: "Imports are not enabled in demo mode.",
		});
	try {
		const { service } = req.body;

		const filetype = req.file.originalname.split(".").at(-1);
		const allowedFiletypes = ["json", "csv"];
		if (!allowedFiletypes.includes(filetype))
			return res.status(400).json({
				message: "Invalid filetype",
			});
		let links;
		const filepath = path.join("tmp", "uploads", req.file.filename);
		if (filetype === "csv") {
			const rows = await processFile(filepath);
			fs.unlinkSync(filepath);
			if (fields[service].filter((requirement) => !Object.keys(rows[0]).includes(requirement)).length != 0) {
				return res.status(400).json({
					message: "Invalid import fields",
				});
			}

			links = rows.map((row) => {
				let link = {};
				if (service === "shlink") {
					link.id = uuid4();
					let slug = new URL(row.shortUrl).pathname.split("");
					if (slug.at(0) === "/") slug.shift();
					if (slug.at(-1) === "/") slug.pop();
					link.slug = slug.join("");
					link.destination = row.longUrl;
					link.author = req.account.id;
					link.creationDate = new Date(row.createdAt);
					link.modifiedDate = new Date(row.createdAt);
					link.visits = row.visits;
				} else if (service === "yourls") {
					let slug = row.source.split("");
					if (slug.at(0) === "/") slug.shift();
					if (slug.at(-1) === "/") slug.pop();
					slug = slug.join("");

					link.id = uuid4();
					link.slug = slug;
					link.destination = row.target;
					link.author = req.account.id;
					link.creationDate = new Date();
					link.modifiedDate = new Date();
					link.visits = row.hits;
				} else if (service === "lynx") {
					link = row;
				}

				return link;
			});
		} else if (filetype === "json") {
			if (service === "lynx") {
				links = JSON.parse(fs.readFileSync(filepath, "utf-8"));

				links = await Promise.all(
					links.map(async (link) => {
						if (!accounts.hasOwnProperty(link.author)) {
							let account = await Account.findOne({ id: link.author });
							if (account) {
								link.author = account.id;
								accounts[account.id] = account;
							} else {
								link.author = req.account.id;
							}
						}
						return link;
					})
				);
				fs.unlinkSync(filepath);
			}
		}

		const slugs = links.map((link) => link.slug);

		const existingSlugs = (
			await Link.find({
				slug: {
					$in: slugs,
				},
			})
		).map((link) => link.slug);

		const originalLinkCount = links.length;

		links = links.filter((link) => !existingSlugs.includes(link.slug));
		await Link.insertMany(links);
		return res.status(200).json({
			success: true,
			message: `Imported ${links.length} / ${originalLinkCount} links!`,
		});
	} catch (e) {
		console.log(e);
		return res.status(500).json({
			message: "Internal Server Error when importing links",
		});
	}
});

module.exports = router;
