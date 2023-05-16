import common from "mocha/lib/interfaces/common";

import{DataSetContent} from "./InsightFacade";
import Decimal from "decimal.js";

export class PerformQuery {
	public queueID: string = "";
	constructor(id: string) {
		this.queueID = id;
	}

	public perform(myQueue: any, currDataSetContent: any): any {
		let dataBase: any[] = [];
		currDataSetContent.forEach((n: DataSetContent) => {
			if (n.id === this.queueID) {
				dataBase = n.data;
			}
		});
		let dataAfterWhere: any = [];
		if (Object.keys(myQueue["WHERE"]).length === 0) {
			dataAfterWhere = dataBase;
		} else {
			for (let data of dataBase) {
				if (this.performWhere(myQueue["WHERE"], data)) {
					dataAfterWhere.push(data);
				}
			}
		}
		let dataAfterTrans: any = dataAfterWhere;
		if (Object.keys(myQueue).includes("TRANSFORMATIONS")) {
			let transformation = myQueue["TRANSFORMATIONS"];
			dataAfterTrans = this.group(dataAfterWhere, transformation["GROUP"], transformation["APPLY"]);
		}
		let dataBeforeSort: any = [];
		let dataFinal: any = [];
		for (let data of dataAfterTrans) {
			let neededData: any = {};
			for (let column of myQueue["OPTIONS"]["COLUMNS"]) {
				neededData[column] = Object.keys(myQueue).includes("TRANSFORMATIONS") ? data[column] :
					data[column.substring(column.indexOf("_") + 1)];
			}
			dataBeforeSort.push(neededData);
		}
		if (Object.keys(myQueue["OPTIONS"]).includes("ORDER")) {
			dataFinal = this.sortHelper(dataBeforeSort, myQueue["OPTIONS"]["ORDER"]);
		} else {
			dataFinal = dataBeforeSort;
		}
		return dataFinal;
	}

	private group(dataAfterWhere: any, group: any, apply: any): any {
		let groupArray: any = {};
		let keyInNewArray: string = "";
		let savedKey: any = [];
		for (let data of dataAfterWhere) {
			keyInNewArray = "";
			for (let groupKey of group) {
				keyInNewArray += groupKey + ":" + this.findValue(data,groupKey);
			}
			if (savedKey.includes(keyInNewArray)){
				groupArray[keyInNewArray].push(data);
			} else {
				savedKey.push(keyInNewArray);
				groupArray[keyInNewArray] = [];
				groupArray[keyInNewArray].push(data);
			}
		}
		let finalResult: any = [];
		for (let key of Object.keys(groupArray)) {
			let applyReturnList: any = {};
			for (let groupKey of group) {
				applyReturnList[groupKey] = this.findValue(groupArray[key][0],groupKey);
			}
			this.apply(applyReturnList,groupArray[key], apply);
			finalResult.push(applyReturnList);
		}
		return finalResult;
	}

	private apply(applyReturnList: any, data: any, apply: any): any {
		// "APPLY": [applyList{
		//           "maxSeats": {Object.keys(applyList)[0]= maxSeats applyKey
		//              token "MAX"token=max: "rooms_seats"insideKey
		//            }
		//       }applyList]
		for (let applyList of apply){
			let applyKey: any = Object.keys(applyList)[0];
			let token: any = Object.keys(applyList[applyKey])[0];
			let insideKey = applyList[applyKey][token];
			if(token === "MAX"){
				let max = Number.MIN_SAFE_INTEGER;
				for (let numbers of data) {
					if (max < this.findValue(numbers, insideKey)) {
						max = this.findValue(numbers, insideKey);
					}
				}
				applyReturnList[applyKey] = Number(max);
			} else if(token === "MIN"){
				let min =  Number.MAX_SAFE_INTEGER;
				for (let numbers of data) {
					if (min > this.findValue(numbers, insideKey)) {
						min = this.findValue(numbers, insideKey);
					}
				}
				applyReturnList[applyKey] = Number(min);
			} else if (token === "SUM"){
				let sum = new Decimal(0);
				for (let numbers of data) {
					let n = new Decimal(this.findValue(numbers, insideKey));
					sum = sum.add(n);
				}
				applyReturnList[applyKey] = Number(sum.toFixed(2));
			} else if(token === "AVG"){
				let sum = new Decimal(0);
				for (let numbers of data) {
					let n = new Decimal(this.findValue(numbers, insideKey));
					sum = sum.add(n);
				}
				applyReturnList[applyKey] = Number((sum.toNumber() / data.length).toFixed(2));
			} else if(token === "COUNT"){
				let temp: any[] = [];
				for (let item of data) {
					if (!temp.includes(this.findValue(item, insideKey))) {
						temp.push(this.findValue(item, insideKey));
					}
				}
				applyReturnList[applyKey] = Number(temp.length);
			}
		}
	}

	private sortHelper(finalData: any, order: any) {
		if(typeof  order === "string") {
			let sortArray: any = finalData.sort((a: any, b: any) => (a[order] < b[order]) ? -1 : 1);
			return sortArray;
		} else {
			return finalData.sort((a: any, b: any) => {
				for (let key of order.keys) {
					if (a[key] < b[key]) {
						return order["dir"] === "UP" ? -1 : 1;
					} else if (a[key] > b[key]) {
						return order["dir"] === "UP" ? 1 : -1;
					} else {
						return 0;
					}
				}
			});
		}
	}


	private performWhere(queue: any, data: any): boolean {
		let value = queue[Object.keys(queue)[0]];
		let keyInSecondLayer = Object.keys(value)[0];
		if (Object.keys(queue)[0] === "AND") {
			for (let and of value) {
				if (!this.performWhere(and, data)) {
					return false;
				}
			}
			return true;
		} else if (Object.keys(queue)[0] === "OR") {
			for (let or of value) {
				if (this.performWhere(or, data)) {
					return true;
				}
			}
			return false;
		} else if (Object.keys(queue)[0] === "NOT") {
			return !this.performWhere(value, data);
		} else if (Object.keys(queue)[0] === "GT") {
			// data, sections_avg number
			return this.findValue(data, keyInSecondLayer) > value[keyInSecondLayer];
		} else if (Object.keys(queue)[0] === "LT") {
			// data, sections_avg number
			return this.findValue(data, keyInSecondLayer) < value[keyInSecondLayer];
		} else if (Object.keys(queue)[0] === "EQ") {
			// data, sections_avg number
			return this.findValue(data, keyInSecondLayer) === value[keyInSecondLayer];
		} else if (Object.keys(queue)[0] === "IS") {
			if (value[keyInSecondLayer].length === 1 && value[keyInSecondLayer].charAt(0) === "*") {
				return true;
			} else if(value[keyInSecondLayer].startsWith("*") && (value[keyInSecondLayer]).endsWith("*")){
				return this.findValue(data, (keyInSecondLayer)).includes
				(value[keyInSecondLayer].substring(1, value[keyInSecondLayer].length - 1));
			}else if((value[keyInSecondLayer]).startsWith("*") && !(value[keyInSecondLayer]).endsWith("*")){
				return this.findValue(data, (keyInSecondLayer)).endsWith
				(value[keyInSecondLayer].substring(1, value[keyInSecondLayer].length ));
			}else if(!(value[keyInSecondLayer]).startsWith("*") && (value[keyInSecondLayer]).endsWith("*")){
				return this.findValue(data, (keyInSecondLayer)).startsWith
				(value[keyInSecondLayer].substring(0, value[keyInSecondLayer].length - 1));
			}else{
				return ((this.findValue(data, (keyInSecondLayer))) ===
					(value[keyInSecondLayer].toString()));
			}
		}
		return false;
	}

	private findValue(data: any, purpose: string){
		// eg:avg
		let name: string = purpose.substring(purpose.indexOf("_") + 1);
		return data[name];
	}

}
