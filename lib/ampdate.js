/*
 Extends the date object so that it can use ISO 8061  
 the 32 character long format used by AMP date datatype
 example: 2012-01-23T12:34:56.054321-01:23
 the existing toISOString() does not provide the timezone 
 difference as needed by AMP datatype. 
 Thus, a new  function is need for this case: toAmpDate()
 AmpDate act just like the Date object with one more function
 */
 
class AmpDate extends Date{
    constructor(dateStr = undefined) {
		let strdate = dateStr
		if(strdate == undefined){
			super();
		}
		else{
            super(dateStr);
		}
    }
	
	toAmpDate(){
	    let datestr = super.toISOString();
		let timeoffset = super.getTimezoneOffset();
		datestr = datestr.substring(0, datestr.length - 1);
		datestr += "000";
		timeoffset = Math.abs(timeoffset);
		let zonehr = String(Math.floor(timeoffset/60));
		let zonemin = String(timeoffset % 60);
		let direction = undefined;
		if(timeoffset>0){
			direction = "+";
		}
		else{
			direction = "-";
		}
		if(zonehr.length == 1){
		    zonehr = "0" + zonehr;
		}
		if(zonemin.length == 1){
			zonemin = "0" + zonemin;
		}
		datestr = datestr + direction + zonehr + ":" + zonemin;
		return datestr;
	}
}

//date1 = new AmpDate("October 13, 2014 11:13:00");
//date1.toAmpDate();

module.exports = {
  AmpDate: AmpDate,
};