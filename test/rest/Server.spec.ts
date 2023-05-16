import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {expect, use} from "chai";
import request, {Response} from "supertest";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import * as fs from "fs-extra";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

describe("Server", () => {
	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL: string;
	before(async () => {
		facade = new InsightFacade();
		server = new Server(4321);
		SERVER_URL = "http://localhost:4321";
		console.info("App::initServer() - start");
		return server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
		// TODO: start server here once and handle errors properly
	});

	after(async () => {
		return server.stop().then(() => {
			console.info("Server::stop() - server closed");
		});
	});

	beforeEach(() => {
		// clearDisk();
	});

	afterEach(() => {
		// clearDisk();
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset", async () => {
		const ENDPOINT_URL = "/dataset/room/rooms";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(fs.readFileSync("test/resources/archives/campus.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.deep.equal({result: ["room"]});
				})
				.catch((err) => {
					console.error("failed " + err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
		}
	});

	it("PUT test for sections dataset", async () => {
		const ENDPOINT_URL = "/dataset/section/sections";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(fs.readFileSync("test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.deep.equal({result: ["room", "section"]});
				})
				.catch((err) => {
					console.error("failed " + err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
		}
	});

	it("PUT test for courses dataset1", async () => {
		const ENDPOINT_URL = "/dataset/room1/rooms";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(fs.readFileSync("test/resources/archives/campus.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.deep.equal({result: ["room","section","room1"]});
				})
				.catch((err) => {
					console.error("failed " + err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
		}
	});

	it("INVALID KIND, PUT test for sections dataset", async () => {
		const ENDPOINT_URL = "/dataset/test0/abcde";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(fs.readFileSync("test/resources/archives/valid.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					expect("error" in res.body).to.be.true;
				})
				.catch((err) => {
					console.error("failed " + err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
		}
	});

	it("INVALID KIND, PUT test for courses dataset", async () => {
		const ENDPOINT_URL = "/dataset/test1/buildings";
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(fs.readFileSync("test/resources/archives/campus.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
					// more assertions here
				})
				.catch((err) => {
					console.error("failed " + err);
					expect.fail();
				});
		} catch (err) {
			console.error(err);
		}
	});
	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
