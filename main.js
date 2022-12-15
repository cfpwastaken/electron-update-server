import express from "express";
import { createReadStream, existsSync, statSync } from "fs";
import { join } from "path";

const app = express();
const router = express.Router();

router.get("/:app/:file", (req, res) => {
	if(!existsSync(join("apps", req.params.app))) {
		res.status(404).json({ status: { success: false, message: "App " + req.params.app + " does not exist" } }).send();
		return;
	}
	if(!existsSync(join("apps", req.params.app, req.params.file))) {
		res.status(404).json({ status: { success: false, message: "File " + req.params.file + " does not exist" }}).send();
		return;
	}
	const range = req.headers.range;
	const length = statSync(join("apps", req.params.app, req.params.file)).size;
	
	if(range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : length - 1;
		console.log(parts, start, end);

		if(start >= length || end >= length) {
			res.status(416).json({ status: { success: false, message: "Requested range not satisfiable (" + start + "-" + end + "/*)" } }).send();
			return;
		}
		
		const rangeFile = createReadStream(join("apps", req.params.app, req.params.file), { start, end });
		res.writeHead(206, {
			"Content-Range": `bytes ${start}-${end}/*`,
			"Accept-Range": "bytes",
			"Content-Length": end - start + 1,
			"Content-Type": "multipart/byteranges"
		})
		rangeFile.pipe(res);
		return;
	}
	const file = createReadStream(join("apps", req.params.app, req.params.file));
	res.writeHead(200, {
		"Content-Length": length
	})
	file.pipe(res);
})

router.all("*", (req, res) => {
	res.status(404).json({ status: { success: false, message: "Unknown request" }});
})

app.use((process.env.SUBPATH ? process.env.SUBPATH : "/"), router);

app.listen(8080, () => {
	console.log("Listening");
})