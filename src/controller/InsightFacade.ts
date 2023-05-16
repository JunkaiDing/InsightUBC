import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import JSZip from "jszip";
import {exists, existsSync, readFileSync, writeFileSync} from "fs";
import {Section} from "./sections";
import {ensureDirSync, ensureFileSync} from "fs-extra";
import {PerformQuery} from "./performQuery";
import {Addroom} from "./addroom";
import {Validator}from "./queryValidator";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export const currDatasetIdPath: string = "./data/currDatasetId.json";
export const currDatasetContentPath: string = "./data/currDatasetContent.json";

export interface DataSetContent {
	id: string;
	kind: InsightDatasetKind;
	length: number;
	data: any;
}

export default class InsightFacade implements IInsightFacade {
	private currDataSetId: any = [];
	private currDataSetContent: any = [];

	private tempContent: DataSetContent[];

	private tempId: string[];

	private tempList: InsightDataset[];

	constructor() {
		console.log("InsightFacadeImpl::init()");
		try {
			if (!existsSync("./data")) {
				ensureDirSync("./data");
				ensureFileSync("./data/currDatasetId.json");
				ensureFileSync("./data/currDatasetContent.json");
				this.currDataSetId = [];
				writeFileSync(currDatasetIdPath, JSON.stringify(this.currDataSetId, null, 4));
				this.currDataSetContent = [];
				writeFileSync(currDatasetContentPath, JSON.stringify(this.currDataSetContent, null, 4));
			}
		} catch (error) {
			console.log("Unable to create data dir");
		}
		try {
			this.currDataSetId = JSON.parse(readFileSync(currDatasetIdPath).toString());
		} catch (error) {
			console.log("Unable to load currDatasetIdPath " + error);
			this.currDataSetId = [];
		}
		try {
			this.currDataSetContent = JSON.parse(readFileSync(currDatasetContentPath).toString());
		} catch (error) {
			console.log("Unable to load currDatasetContentPath " + error);
			this.currDataSetContent = [];
		}
		this.tempId = [];
		this.tempList = [];
		this.tempContent = [];
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (this.checkIdValidity(id) || content === "") {
			return Promise.reject(new InsightError("invalid id or content"));
		}
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError("invalid kind"));
		}
		// async referenced from the website given on the checkpoint 1 page.
		// https://github.com/ubccpsc/310/blob/main/resources/readings/cookbooks/async.md
		return new Promise<string[]>((resolve, reject) => {
			try {
				if (kind === InsightDatasetKind.Sections) {
					this.addSection(content).then((data: any) => {
						this.currDataSetContent.push({
							id: id, kind: kind, length: data.length, data: data
						});
						this.currDataSetId.push(id);
						writeFileSync(currDatasetIdPath, JSON.stringify(this.currDataSetId, null, 4));
						writeFileSync(currDatasetContentPath, JSON.stringify(this.currDataSetContent, null, 4));
						return resolve(this.currDataSetId);
					}).catch((err: any) => {
						reject(err);
					});
				} else {
					if (kind === InsightDatasetKind.Rooms) {
						let addroom = new Addroom();
						addroom.addRoom(id, content).then((data: any) => {
							if (data.length === 0) {
								return Promise.reject(new InsightError("empty dataSet"));
							}
							this.currDataSetContent.push({
								id: id, kind: kind, length: data.length, data: data
							});
							this.currDataSetId.push(id);
							writeFileSync(currDatasetIdPath, JSON.stringify(this.currDataSetId, null, 4));
							writeFileSync(currDatasetContentPath, JSON.stringify(this.currDataSetContent, null, 4));
							return resolve(this.currDataSetId);
						}).catch((err: any) => {
							reject(err);
						});
					} else {
						return Promise.reject(new InsightError("invalid kind"));
					}
				}
			} catch (err: any) {
				reject(err);
			}
		});
	}

	public removeDataset(id: string): Promise<string> {
		if (id === "" || id == null || id.includes("_")) {
			return Promise.reject(new InsightError("Invalid Id"));
		}
		if (!this.currDataSetId.includes(id)) {
			return Promise.reject(new NotFoundError("Id not found"));
		}

		return new Promise((resolve, reject) => {
			try {
				this.currDataSetContent.forEach((n: DataSetContent) => {
					if (n.id !== id) {
						this.tempContent.push(n);
						this.tempId.push(n.id);
					}
				});
				this.currDataSetId = this.tempId;
				this.currDataSetContent = this.tempContent;
				writeFileSync(currDatasetIdPath, JSON.stringify(this.currDataSetId, null, 4));
				writeFileSync(currDatasetContentPath, JSON.stringify(this.currDataSetContent, null, 4));
				return resolve(id);
			} catch (err) {
				reject(new InsightError("failed"));
			}
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		if (typeof query !== "object" || Array.isArray(query)) {
			return Promise.reject(new InsightError("invalid queue"));
		}
		return new Promise<InsightResult[]>((resolve, reject) => {
			let checkQuery = new Validator();
			if (!checkQuery.validate(query)) {
				reject(new InsightError("not valid"));
			}
			let performQuery = new PerformQuery(checkQuery.queueID);
			if (!this.currDataSetId.includes(performQuery.queueID)) {
				reject(new InsightError("no such dataBase"));
			}
			try {
				let result: any = performQuery.perform(query, this.currDataSetContent);
				if (result.length > 5000) {
					reject(new ResultTooLargeError("> 5000"));
				} else {
					return resolve(result);
				}
			} catch (e) {
				reject(new InsightError("failed perform " + e));
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise((resolve) => {
			this.currDataSetContent.forEach((n: DataSetContent) => {
				this.tempList.push({
					id: n.id, kind: n.kind, numRows: n.length
				});
			});
			return resolve(this.tempList);
		});
	}

	private checkIdValidity(id: string): boolean {
		return (id === "" || id == null || id.includes("_") || this.currDataSetId.includes(id));
	}

	private addSection(content: string): any {
		let jsonArray: any = [];
		let zip = JSZip();
		let sectionArray: any = [];
		// referenced from TypeScript jszip loadAsync Examples with website of
		// https://typescript.hotexamples.com/examples/jszip/-/loadAsync/typescript-loadasync-function-examples.html
		return new Promise((resolve, reject) => {
			try {
				zip.loadAsync(content, {base64: true}).then((unzip: any) => {
					unzip.folder("courses").forEach((filePath: any, courseFile: any) => {
						jsonArray.push(courseFile.async("string"));
					});
					Promise.all(jsonArray).then((files) => {
						for (let file of files) {
							try {
								let result = JSON.parse(file.toString())["result"];
								this.helper(result, sectionArray);
							} catch (e) {
								reject(e);
							}
						}
						resolve(sectionArray);
					}).catch((e) => {
						reject(new InsightError(e));
					});
				}).catch((err) => {
					reject(new InsightError(err));
				});
			} catch (e) {
				return Promise.reject(new InsightError("Invalid Dataset"));
			}
		});
	}

	private helper(parse: any, sectionArray: any[]) {
		for (let sections of parse) {
			let i = sections["id"].toString();
			let c = sections["Course"];
			let t = sections["Title"];
			let p = sections["Professor"];
			let s = sections["Subject"];
			let y = Number(sections["Year"]);
			if (sections["Section"] === "overall") {
				y = 1900;
			}
			let a1 = sections["Avg"];
			let p2 = sections["Pass"];
			let f = sections["Fail"];
			let a = sections["Audit"];
			let newSection = new Section(i, c, t, p, s, y, a1, p2, f, a);
			sectionArray.push(newSection);
		}
	}
}
