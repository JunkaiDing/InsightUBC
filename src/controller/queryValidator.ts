import {log} from "util";

const sfield: string[] = ["dept", "id", "instructor", "uuid", "title","fullname",
	"shortname", "number", "name", "address", "type", "furniture", "href"];
const mfield: string[] = ["avg", "pass", "fail", "audit", "year","lat", "lon", "seats"];
const validApply: string[] = ["MAX" , "MIN" , "AVG" , "COUNT" , "SUM"];
const direction: string[] = ["UP", "DOWN"];

export class Validator {
	private savedKeys: string [] = [];
	public queueID: string = "";
	private b: boolean = false;
	private savedApply: any = [];
	private savedGroup: any = [];

	public validate(query: any): boolean {
		if(Object.keys(query).length === 2){
			if (!query["WHERE"] || !query["OPTIONS"]) {
				return false;
			}
		}else if(Object.keys(query).length === 3){
			if (!query["WHERE"] || !query["OPTIONS"] || !query["TRANSFORMATIONS"]){
				return false;
			}
		}else {
			return false;
		}
		if (Object.keys(query).length === 2) {
			return (this.validateWhere(query["WHERE"]) && this.validateOption(query["OPTIONS"]));
		} else {

			if (this.validateTransformation(query["TRANSFORMATIONS"])) {
				return (this.validateWhere(query["WHERE"]) && this.validateOption(query["OPTIONS"]));
			} else {
				return false;
			}
		}
	}

	private validateTransformation(trans: any): boolean {
		let transKey = Object.keys(trans);
		if (transKey.length !== 2 || !trans["GROUP"] || !trans["APPLY"]) {
			return false;
		}else if (!Array.isArray(trans["GROUP"]) || trans["GROUP"].length < 1) {
			return false;
		}else {
			for (let key of trans["GROUP"]) {
				if (!this.checkKeyM(key) && !this.checkKeyS(key)) {
					return false;
				} else {
					this.savedGroup.push(key);
				}
			}
		}
		if (!Array.isArray(trans["APPLY"])) {
			return false;
		}
		for (let apply of trans["APPLY"]) {
			if (this.savedApply.includes(Object.keys(apply)[0]) || Object.keys(apply).length !== 1) {
				return false;
			} else {
				this.savedGroup.push(Object.keys(apply)[0]);
				this.savedApply.push(Object.keys(apply)[0]);
				if(!this.validateApply(apply)){
					return false;
				};
			}
		}
		return true;
	}

	private validateApply(apply: any): boolean {
		let b: boolean = false;
		let applyKey = Object.keys(apply)[0];
		let applyValue = apply[applyKey];
		if (applyKey === "" || applyKey.includes("_")) {
			return false;
		}
		if (validApply.includes(Object.keys(applyValue)[0])) {
			if(Object.keys(applyValue)[0] === "COUNT"){
				if(this.checkKeyS(applyValue[Object.keys(applyValue)[0]]) ||
					this.checkKeyM(applyValue[Object.keys(applyValue)[0]])){
					b = true;
				}
			} else {
				b = this.checkKeyM(applyValue[Object.keys(applyValue)[0]]);
			}
		}
		return b;
	}

	private validateOption(options: any): boolean {
		if (Object.keys(options).length < 1 || Object.keys(options).length > 2 ||
			!options["COLUMNS"] || options["COLUMNS"].length === 0) {
			return false;
		}
		if(!this.validateColumns(options)){
			return false;
		}
		if(Object.keys(options).length === 2){
			if(!options["COLUMNS"] || !options["ORDER"] || !Array.isArray(options["COLUMNS"]) ||
				options["ORDER"] === null || options["ORDER"].length === 0){
				return false;
			} else{
				for (let key in options) {
					if (key === "ORDER") {
						if((typeof options[key] === "string")) {
							if(!this.savedKeys.includes(options[key])){
								return false;
							}
						} else if((typeof options[key] === "object")) {
							if(!this.validateMultiOptions(options[key],options["COLUMNS"])){
								return false;
							};
						}
					}
				}
			}
		}
		return true;
	}

	private validateMultiOptions(key: any, column: any): boolean {
		if(Object.keys(key).length !== 2 || !key["dir"] ||
			!key["keys"] || !Array.isArray(key["keys"]) || key["keys"].length === 0) {
			return false;
		}else {
			let dir = key["dir"];
			let keys = key["keys"];
			if (!direction.includes(dir)) {
				return false;
			} else {
				for (let checkKey of keys) {
					if (!column.includes(checkKey)){
						return false;
					}
				}
			}
		}
		return true;
	}

	private validateColumns(options: any): boolean{
		if (!Array.isArray(options["COLUMNS"]) || options["COLUMNS"].length === 0) {
			return false;
		}
		for (let column of options["COLUMNS"]) {
			if(this.savedGroup.length > 0 && !this.savedGroup.includes(column)) {
				return false;
			}
			if (!this.checkKeyS(column) && !this.checkKeyM(column) &&
				!this.savedApply.includes(column)) {
				return false;
			} else {
				this.savedKeys.push(column);
			}

		}
		return true;
	}

	private validateWhere(filter: any): boolean {
		if (Object.keys(filter).length === 0) {
			return true;
		}
		try {
			let key = Object.keys(filter)[0];
			let value = filter[key];
			return this.validate0(value, key, filter);
		} catch (e) {
			return false;
		}
	}

	private checkKeyM(key: any): boolean {
		if(typeof key !== "string"){
			return false;
		}
		if(!key.includes("_")){
			return false;
		}else {
			return (this.checkID(key.substring(0, key.indexOf("_")))
				&& mfield.includes(key.substring(key.indexOf("_") + 1)));
		}
	}

	private checkKeyS(key: any): boolean {
		if(typeof key !== "string"){
			return false;
		}
		if (!key.includes("_")) {
			return false;
		} else {
			return (this.checkID(key.substring(0, key.indexOf("_")))
				&& sfield.includes((key.substring(key.indexOf("_") + 1))));
		}
	}

	private checkID(key: string): boolean {
		if(key === "") {
			return false;
		}
		if(this.queueID === ""){
			this.queueID = key;
		}
		return this.queueID === key;
	}

	private validate0 (value: any, key: any, filter: any): boolean{
		if (Object.keys(filter).length > 1 || typeof Object.keys(value)[0] !== "string" ||
			typeof filter !== "object") {
			return false;
		}
		if (key === "AND" || key === "OR") {
			let b: boolean = true;
			if (!Array.isArray(value) || value === null || value.length < 1 || typeof value !== "object") {
				return false;
			}
			value.forEach((newFilter) => {
				if (!this.validateWhere(newFilter)) {
					b = false;
				}
			});
			return b;
		} else if (key === "NOT") {
			if (value === null || Array.isArray(value) || !value) {
				return false;
			}
			return this.validateWhere(value);
			// compare
		} else if (key === "LT" || key === "GT" || key === "EQ") {
			if (value === null || Array.isArray(value) || !value ||
				typeof value !== "object" || Object.keys(value).length !== 1 ||
				!this.checkKeyM(Object.keys(value)[0]) || typeof value[Object.keys(value)[0]] !== "number") {
				return false;
			}
		} else if (key === "IS") {
			if (typeof Object.keys(value)[0] !== "string" || typeof value !== "object" ||
				!this.checkKeyS(Object.keys(value)[0]) || Object.keys(value).length !== 1) {
				return false;
			}
			let valueReadyToCheck = value[Object.keys(value)[0]];
			if(valueReadyToCheck === "*"){
				return true;
			}
			if (valueReadyToCheck.substring(1, valueReadyToCheck.length - 1).includes("*")) {
				return false;
			}
		} else {
			return false;
		}
		return true;
	}

}
