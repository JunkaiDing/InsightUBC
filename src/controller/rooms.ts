export class Rooms {

	private fullname: string;
	private shortname: string;
	private number: string;
	private name: string;
	private address: string;
	private lat: number;
	private lon: number;
	private seats: number;
	private type: string;
	private furniture: string;
	private href: string ;          // The link to full rooms
	constructor(fName: string,sName: string,nu: string,na: string, a: string,
		la: number,lo: number,s: number,t: string,fur: string, h: string) {
		this.fullname = fName;
		this.shortname = sName;
		this.number = nu;
		this.name = na;
		this.address = a;
		this.lat = la;
		this.lon = lo;
		this.seats = s;
		this.type = t;
		this.furniture = fur;
		this.href = h;
	}
}
