import {InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import * as http from "http";
import {IncomingMessage} from "http";
import {parse} from "parse5";
import {Rooms} from "./rooms";

export class Addroom {
	private buildingCode: any;
	private buildingTitle: any;
	private buildingAddress: any;
	private buildingHref: any;
	private unzipFolder: any;
	private tempArray: Rooms[] = [];
	private promises: Array<Promise<any>> = [];

	public async addRoom(id: string, content: string): Promise<Rooms[]> {
		let zip = JSZip();
		return new Promise<Rooms[]>((resolve, reject) => {
			zip.loadAsync(content, {base64: true}).then((unzip: any) => {
				if (unzip.file("index.htm") === null ||
					unzip.file("index.htm") === undefined) {
					reject(new InsightError("index file not exist"));
				}
				this.unzipFolder = unzip;
				this.helper(unzip).then((result) =>{
					resolve(result);
				} );
			});
		}).catch((e) => {
			return Promise.reject(new InsightError(e));
		});
	}

	private async helper(unzip: any): Promise<Rooms[]>{
		return new Promise((resolve, reject) => {
			unzip.file("index.htm").async("text").then((index: string) => {
				let indexhtm = parse(index);
				let tbody: any = this.getTbody(indexhtm);
				this.getTrNodeAndBuildingInfo(tbody).then((result) => {
					return resolve(result);
				});
			}).catch((e: any) => {
				reject(new InsightError(e));
			});
		});
	}

	private getTbody(indexhtm: any): any{
		if (indexhtm.nodeName === "tbody") {
			return  indexhtm;
		} else {
			if (indexhtm.childNodes !== undefined) {
				for (let childNode of indexhtm.childNodes) {
					if (this.getTbody(childNode)) {
						return this.getTbody(childNode);
					}
				}
			}
			return ;
		}
	}

	private async getTrNodeAndBuildingInfo(tbody: any): Promise<Rooms[]> {
		for (let childNode of tbody.childNodes) {
			let buildingCode: string = "";
			let buildingTitle: string = "";
			let buildingAddress: string = "";
			let buildingHref: string = "";
			if (childNode.nodeName === "tr") {
				let trnode: any = childNode;
				for (let childNode1 of trnode.childNodes) {
					if (childNode1.nodeName === "td") {
						// trim() function is referenced from
						// https://www.educative.io/answers/what-is-the-stringtrim-method-in-typescript
						if (childNode1.attrs[0].value === "views-field views-field-field-building-code") {
							buildingCode = childNode1.childNodes[0].value.trim();
							this.buildingCode = buildingCode;
						} else if (childNode1.attrs[0].value === "views-field views-field-title") {
							buildingTitle = childNode1.childNodes[1].childNodes[0].value.trim();
							this.buildingTitle = buildingTitle;
						} else if (childNode1.attrs[0].value ===
							"views-field views-field-field-building-address") {
							buildingAddress = childNode1.childNodes[0].value.trim();
							this.buildingAddress = buildingAddress;
						} else if (childNode1.attrs[0].value === "views-field views-field-nothing") {
							buildingHref = childNode1.childNodes[1].attrs[0].value.trim();
							this.buildingHref = buildingHref;
						}
					}
				}
				this.promises.push(this.getGeoLocation(buildingAddress).then((result) => {
					let dataArray: any[] = [buildingTitle, buildingCode, buildingAddress,
						result.lat, result.lon];
					return this.getTrNodeAndRoomInfo(this.unzipFolder, buildingHref, dataArray);
				}).then((resultArray: Rooms[]) => {
					for(let room of resultArray){
						this.tempArray.push(room);
					}
				}).catch((e) => {
					console.log(e);
				}));
			}
		}
		try {
			await Promise.all(this.promises);
		} catch (err) {
			return Promise.reject(err);
		}
		if (this.tempArray.length === 0) {
			return Promise.reject(new InsightError("empty dataSet"));
		} else {
			return this.tempArray;
		}
	}


	private async getGeoLocation(buildingAddress: any): Promise<any> {
		let webService: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team174/" +
			encodeURIComponent(buildingAddress);
		let geoLocation: any;
		return new Promise((resolve, reject) => {
			try {
				http.get(webService, (res: IncomingMessage) => {
					const {statusCode} = res;
					let error;
					if (statusCode !== 200) {
						error = new Error("Request Failed.\n" +
							`Status Code: ${statusCode}`);
					}
					if (error) {
						console.error(error.message);
						res.resume();
						reject(error);
					}
					res.setEncoding("utf8");
					let rawData = "";
					res.on("data", (chunk) => {
						rawData += chunk;
					});
					res.on("end", () => {
						try {
							geoLocation = JSON.parse(rawData);
							return resolve(geoLocation);
						} catch (e) {
							reject(new InsightError("failed to parse geoLocation" + e));
						}
					});
				}).on("error", (e) => {
					geoLocation = ({error: "failed " + e});
					return resolve(geoLocation);
				});
			} catch (e) {
				reject(new InsightError("failed get geoLocation " + e));
			}
		});
	}

	private async getTrNodeAndRoomInfo(unzipFolder: any, siBuilding: any, dataArray: any): Promise<Rooms[]> {
		return new Promise<Rooms[]>((resolve, reject) => {
			unzipFolder.file(siBuilding.substring(2)).async("text").then((rooms: string) => {
				let buildingArray: Rooms[] = [];
				let roomhtm = parse(rooms);
				let tbody = this.getTbody(roomhtm);
				if (tbody === undefined) {
					resolve([]);
				} else {
					for (let childNode of tbody.childNodes) {
						let roomNum: string = "";
						let roomCapa: number = 0;
						let roomFurn: string = "";
						let roomType: string = "";
						let roomHref: string = "";
						if (childNode.nodeName === "tr") {
							let trnode: any = childNode;
							for (let childNode1 of trnode.childNodes) {
								if (childNode1.nodeName === "td") {
									let attrsValue: any = childNode1.attrs[0].value;
									if (attrsValue === "views-field views-field-field-room-number") {
										roomNum = childNode1.childNodes[1].childNodes[0].value.trim();
									} else if (attrsValue === "views-field views-field-field-room-capacity") {
										roomCapa = Number(childNode1.childNodes[0].value.trim());
									} else if (attrsValue === "views-field views-field-field-room-furniture") {
										roomFurn = childNode1.childNodes[0].value.trim();
									} else if (attrsValue === "views-field views-field-field-room-type") {
										roomType = childNode1.childNodes[0].value.trim();
									} else if (attrsValue === "views-field views-field-nothing") {
										roomHref = childNode1.childNodes[1].attrs[0].value.trim();
									}
								}
							}
							buildingArray.push(new Rooms(dataArray[0], dataArray[1], roomNum,
								dataArray[1] + "_" + roomNum, dataArray[2], dataArray[3], dataArray[4],
								Number(roomCapa), roomType, roomFurn, roomHref));
						}
					}
				}
				return resolve(buildingArray);
			}).catch((e: any) => {
				reject(new InsightError("e"));
			});
		});
	}
}
