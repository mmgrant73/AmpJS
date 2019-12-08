/*
This file handles AmpBoxes that are received from the network.
Variables:
    box: holds the data from the Ampbox in an object (key, value) pairs
	_unprocessed: holds the raw data coming from the network
Methods:
    dataReceived method is called when data is received from the network and
	performs two basic functions:
	1) The while loop goes through the data until it finds the stop bytes.
	2) After determining the all data has been received it will processed the 
	   data into the box object in key - value pairs
Callback:
    receiveBoxCallback should be the user defined call back funtion for handling incoming data   	
*/

function ReceiverBox (receiveBoxCallback) {
    this.box = {};
    this._unprocessed = Buffer.alloc(0); 
    this._nextKey = null;
    this.receiveBox = receiveBoxCallback || function(box) { console.log(box); }; //receiveBoxCallback
}

ReceiverBox.prototype.dataReceived = function (data) {
	this._unprocessed = Buffer.concat([this._unprocessed, data]);
	var offset = 0;
	var nextOffset = 0;
	var flag = true;
	var arrlength = [];
    /* 
	  This part checkes if all the data has been received.  It will not process data until
	  all the data has been received so that the data will not be corrupted.
	  While loop checks for the stop bytes which is length of 0 => (0x00 0x00)
	*/
	while(flag){
	    var datalength = this._unprocessed.length;
	    var length = this._unprocessed.readInt16BE(offset, offset + 2);
		arrlength.push(length);
		/*
		if the datalength is less than length or is less than nextOffset then more data 
		is coming and thus it returns and try again when more data is received
		*/
		if(datalength < length + 2 || datalength < nextOffset ){
			return;
		}
		nextOffset = offset + length + 2;
		try{
		    var len1 = this._unprocessed.readInt16BE(nextOffset, nextOffset + 2);
		}
	    catch{
			/*sometimes there might be a delay in data  which will cause nextOffset
			  to go overflow because it does not have all data this will catch it
			  and return it until more data is received.
			*/
		    return;	
		}
		if(len1 == 0){
		    flag = false;
		}
		offset = nextOffset;
	}
	
	/*
	  This part will only after all the data has been received.  Once this happens
	  the data is stored in the box object in key - value pairs
	*/
	offset = 2;
	keystate = 0;
	for (var index = 0; index < arrlength.length; index++) { 
		if(keystate==0){
			// Get the Key name for the key - value pair
		    key = this._unprocessed.slice(offset, arrlength[index] + offset);
			keystate = 1;
		}
		else{
			// Get the value for the given Key
		    value = this._unprocessed.slice(offset, arrlength[index] + offset);
			this.box[key] = value;
			keystate = 0;
		}
		offset = offset + arrlength[index] + 2;
	}
	
	// Sends off the box and clears the box and buffers
	this.receiveBox(this.box);
    this.box = {};
	this._unprocessed = Buffer.alloc(0);
}

module.exports = {
  ReceiverBox: ReceiverBox,
};