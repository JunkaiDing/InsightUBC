export class Section{

	private uuid: string;
	private id: string;
	private title: string;
	private instructor: string;
	private dept: string;
	private year: number;
	private avg: number;
	private pass: number;
	private fail: number;
	private audit: number;
	constructor(i: string,c: string,t: string,p: string,s: string,y: number,a1: number,p2: number,f: number,a: number) {
		this.uuid = i;
		this.id = c;
		this.title = t;
		this.instructor = p;
		this.dept = s;
		this.year = y;
		this.avg = a1;
		this.pass = p2;
		this.fail = f;
		this.audit = a;
	}
}
