import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightError, InsightDataset, InsightDatasetKind, InsightResult} from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.addDataset);
		this.express.get("/datasets", Server.listDataset);
		this.express.delete("/dataset/:id", Server.removeDataset);
		this.express.post("/query", Server.performQuery);
		this.express.put("*", Server.missingURL);
		this.express.get("*", Server.missingURL);
		this.express.delete("*", Server.missingURL);
		this.express.post("*", Server.missingURL);
	}

	private static addDataset(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();
			let id = req.params.id;
			let kind: InsightDatasetKind = InsightDatasetKind.Rooms;
			if (((req.params.kind ?? "").trim().toLowerCase() !== "rooms") &&
				((req.params.kind ?? "").trim().toLowerCase() !== "sections")) {
				console.info(3);
				res.status(400).json({error: "Invalid dataset kind"});
				return;
			} else if ((req.params.kind ?? "").trim().toLowerCase() === "sections") {
				kind = InsightDatasetKind.Sections;
			}
			const body: string = Buffer.from(req.body, "binary").toString("base64");
			return insightFacade
				.addDataset(id, body, kind)
				.then((result) => {
					res.status(200).json({result: result});
				})
				.catch((e) => {
					console.info(e);
					res.status(400).json({error: "invalid dataset"});
				});
		}catch (e) {
			res.status(400).json({error: "invalid dataset"});
		}
	}

	private static removeDataset(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();
			let id = req.params.id;
			return insightFacade
				.removeDataset(id)
				.then((result) => {
					res.status(200).json({result: result});
				})
				.catch((e) => {
					if (e instanceof InsightError) {
						res.status(400).json({error: "invalid id"});
					} else {
						res.status(404).json({error: "invalid id"});
					}
				});
		} catch (e) {
			res.status(400).json({error: e});
		}
	}

	private static listDataset(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();
			return insightFacade
				.listDatasets()
				.then((result) => {
					res.status(200).json({result: result});
				})
				.catch((e) => {
					console.log("listDataset bug");
				});
		} catch (e) {
			res.status(400).json({error: "bug"});
		}
	}

	private static performQuery(req: Request, res: Response) {
		try {
			let insightFacade = new InsightFacade();
			return insightFacade
				.performQuery(req.body)
				.then((result) => {
					res.status(200).json({result: result});
				})
				.catch((e) => {
					console.info(e);
					res.status(400).json({error: "invalid query"});
				});
		} catch (e) {
			res.status(400).json({error: "invalid query"});
		}
	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static missingURL(req: Request, res: Response) {
		res.status(400).json({error: "missingURL"});
	}
}
