////////////////////////////////// AmpDate ///////////////////////////////////
var net = require('net');
 
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

///////////////////////////////////////////////////Commands ////////////////////////////////


//var MapExt = require('./mapext');
//var server = require('./server');

class CommandLocator{
    constructor(factorycommands, factorycallbacks){
        this.commands = factorycommands;
		this.callback = factorycallbacks;
    }
	createcommand(commandtype, arguments1){
		try{          
	        return new this.commands[commandtype](arguments1, this.callback[commandtype]);
		}
		catch{
		    console.log("Invalid command: something happen over the wire");	
			return 0; 
		}
	}
}

class Command { 
    constructor(maparg, mapres, arguments1, fn ) { 
        this.fn = fn;
		this.arguments = maparg;
		this.response = mapres;
		var is_error = this.checkerror(maparg, mapres, arguments1);
		if(is_error){
			// Is an error command
		}
		else{
			var res = this.checkarguments(arguments1);
			if(res == true){
				this.setarguments(arguments1);
			}
			else{
				console.log("[Error] - arguments does not match");
                this.seterror("120", "arguments does not match");
			}
		}
    }
	
	seterror(code, description){
	    errorObj.set_code(code);
		errorObj.set_description(description);
	}
	
	checkerror(maparg, mapres, arguments1){
		var res1 = MapExt.isEmpty(arguments1);
		var res2 = MapExt.isEmpty(MapExt);
		var res3 = false;
		var result = false;
		var keyarray = Array.from(mapres.keys());
        if(keyarray[0] == "_error" || keyarray[1] == "_error_code" || keyarray[2] == "_error_description"){
			res3 = true;
		}
		if(res1==true && res2==true && res3 == true){
			result = true;
		}
        return result;
	} 
	
	checkresponse(response){
		return MapExt.compareMapsKeys(this.response, response);
	}
	
	checkarguments(arguments1){
		return MapExt.compareMapsKeys(this.arguments, arguments1);
	}
	
	setarguments(arguments1){
		for (var [key, value] of arguments1) {
			var valuetype = this.arguments.get(key);
			var value1 = this.parsetype(valuetype, value);
			this.arguments.set(key, value1);
        }	
	}
	
	setresponse(mapanswer, mapdata){
		var mapresponse = new Map([...mapanswer, ...mapdata]);
		for (var [key, value] of mapresponse) { 
			var valuetype = this.response.get(key);
			var value1 = String(value)
			this.response.set(key, value1); 
		}
	}
	
	parsetype(valuetype, value){
		if(valuetype == "integer"){;
			var value = parseInt(value); 
		}
		else if(valuetype == "string"){
			var value = String(value);
		}
		else if(valuetype == "float"){
			var value = parseFloat(value);
		}
		else if(valuetype == "boolean"){
			if(value == 'false' || value == '0'){
				var value = Boolean(false);
			}
			else{
			    var value = Boolean(true);
			}
		}
		else if(valuetype == "datetime"){
			if(value.length == 32){
				var value = value;
			}
			else{
			    console.log("Not the right format for the datetime value");	
				this.seterror("160", "Not the right format for the datetime value");
			}
		}
		else if(valuetype == "list[string]"){
			var value = String(value);
		}
		else if(valuetype == "amplist"){
			var value = parseFloat(value);
		}
		else{
			console.log("[Error] - not a valid valuetype");
			this.seterror("150", "not a valid valuetype");
		}
		return value;
	}
}

//var command = require('./command');
//var server = require('./server');

var factory = { 
    factorycommands : "", 
	factorycallbacks : "",
}


function CreateController(data){
	var con = new Controller(data, factory.factorycommands, factory.factorycallbacks);
	if(errorObj.code == ""){
	    answer = con.run_responder();
	    con.from_command(answer);
	}
	else{
	    con.to_error(errorObj.code, errorObj.description);
	}
}

class Controller { 
    constructor(data, factorycommands, factorycallbacks) {
        this._data = data;
		this._ask = undefined;
		this._answer = undefined;
		this._command = undefined;
		this._error = undefined;
		this._error_code = undefined;
		this._error_description = undefined;
		this.factorycommands = factorycommands;
		this.factorycallbacks = factorycallbacks;
		this.arguments = new Map();
		this.parsedata()
		this.locator = this.to_command()
    } 
   
    get data() {
        return this._data;
    }

    set data(newdata) {
        this._data = newdata; 
    }
	
	get ask() {
        return this._ask;
    }

    set ask(newdata) {
        this._ask = newdata;  
    }
	
	get answer() {
        return this._answer;
    }

    set answer(newdata) {
        this._answer = newdata;  
    }
	
	get command() {
        return this._command;
    }

    set command(newdata) {
        this._command = newdata;  
    }
	
	get error() {
        return this._error;
    }

    set error(newdata) {
        this._error = newdata;  
    }
	
	get error_code() {
        return this._error_code;
    }

    set error_code(newdata) {
        this._error_code = newdata;  
    }
	
	get error_description() {
        return this._error_description;
    }

    set error_description(newdata) {
        this._error_description = newdata;  
    }
	
	parsedata(){
		Object.entries(this.data).forEach(entry => {
            let key = entry[0];
            let value = entry[1];
			if(key=="_ask"){
				this.ask = value;
			}
			else if(key=="_answer"){
				this.answer = value;
			}
			else if(key=="_command"){
				this.command = value;
			}
			else if(key=="_error"){
				this.error = value;
				this.command = "error";
			}
			else if(key=="_error_code"){
				this.error_code = value;
			}
			else if(key=="_error_description"){
				this.error_description = value;
			}
			else{
				this.arguments.set(key, value);
		    }
        });
    }
	
	checkkey(key, value){
		if(this.arguments.has(key)){
			value1 = this.arguments.get(key);
			if(Array.isArray(value1)){
				value1.push(value);
				this.arguments.set(key, value1);
			}
			else{
				valuearray = [value1, value];
				this.arguments.set(key, valuearray);
			}
			return true;
		}
		return false;
	}
	
	run_responder(){
		return this.locator.responder(this.locator.arguments);
	}
	
	to_command(){
		let customlocator = new CommandLocator(this.factorycommands, this.factorycallbacks);
		let com = customlocator.createcommand(this.command, this.arguments);
		if(com==0){
			this.to_error("111","the incoming data has been corrupted");
		}
		else{
		    return com
		}
    }
	
	from_command(mapdata){
		this.answer = String(this.ask);
		var mapanswer = new Map();
		mapanswer.set('_answer', this.answer); 
		var res = this.locator.checkresponse(mapdata);
		if(res == true){
		    this.locator.setresponse(mapanswer, mapdata);
		}
		else{
		    console.log("[Error] - the responds arguments does not match");
            this.to_error("101","the response arguments does not match");
            return;			
		}
		this.to_box();
	}
	
	dict_reverse(obj) {
		var new_obj = {};
		let rev_obj = Object.keys(obj).reverse();
		rev_obj.forEach(function(i) { 
		    new_obj[i] = obj[i];
		})
		return new_obj;
	}
	
	to_error(error_code, error_description){
		this.error = String(this.ask);
		this.error_code = error_code;
		this.error_description = error_description;
		var maperror = new Map([["_error", this.error], ["_error_code", this.error_code], ["_error_description", this.error_description]]);
		var errorobj = {};
		errorobj["_error"] = Buffer.alloc((String(this.error).length), String(this.error), 'utf8');
		errorobj["_error_code"] = Buffer.alloc((String(this.error_code).length), String(this.error_code), 'utf8');
		errorobj["_error_description"] = Buffer.alloc((String(this.error_description).length), String(this.error_description), 'utf8');
		server.reply(errorobj);
	}
	
	to_box(data){
		var map1 = this.locator.response;
		var replyCall = {};
		for (var [key, value] of map1) {
		   	replyCall[key] = Buffer.alloc((String(value).length), String(value), 'utf8');
		}
		var res = this.dict_reverse(replyCall);
		const entries = Object.entries(res);
		console.log("replycall => " + entries );
		server.reply(res);
	}
	
	from_box(data){
	
	}
}

//////////////////////////////////// mapext //////////////////////////////////////////

class MapExt extends Map{

	static reverseMap(map1){
	    return new Map([...map1].reverse());	
	}
	
	static invertMap(map1){
		let map2 = new Map();
        for (let [key, value] of map1) {
            let v = map1.get(key);
            map2.set(v, key);
        }
		return map2
	}
	
	static isEmpty(map1){
	    if(map1.size == 0){
		    return false;
		}
		return true;
	}
	
	static compareMapSize(map1, map2) {	
		if (map1.size !== map2.size) {
			return false;
		}
		return true;
	}
	
    static compareMaps(map1, map2) {		
		var testVal;
		if(!MapExt.compareMapSize(map1, map2)){
		    return false;	
		}
		for (var [key, val] of map1) {
			testVal = map2.get(key);
			if (testVal !== val || (testVal === undefined && !map2.has(key))) {
				return false;
			}
		}
		return true;
    }
	
	static compareMapsKeys(map1, map2) {		
		if(!MapExt.compareMapSize(map1, map2)){
		    return false;	
		}
		for (var [key, val] of map1) {
			if (!map2.has(key)) {
				return false;
			}
		}
		return true;
    }
	
	static mergeMaps(map1, map2) {
	    return new Map([...map1, ...map2]);
	}
}

////////////////////////////////////////// receiverbox ///////////////////////////////////

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
	while(flag){
	    var datalength = this._unprocessed.length;
	    var length = this._unprocessed.readInt16BE(offset, offset + 2);
		arrlength.push(length);
		if(datalength < length + 2 || datalength < nextOffset ){
			return;
		}
		nextOffset = offset + length + 2;
		try{
		    var len1 = this._unprocessed.readInt16BE(nextOffset, nextOffset + 2);
		}
	    catch{
		    return;	
		}
		if(len1 == 0){
		    flag = false;
		}
		offset = nextOffset;
	}

	offset = 2;
	keystate = 0;
	for (var index = 0; index < arrlength.length; index++) { 
		if(keystate==0){
		    key = this._unprocessed.slice(offset, arrlength[index] + offset);
			keystate = 1;
		}
		else{
		    value = this._unprocessed.slice(offset, arrlength[index] + offset);
			this.box[key] = value;
			keystate = 0;
		}
		offset = offset + arrlength[index] + 2;
	}
	
	this.receiveBox(this.box);
    this.box = {};
	this._unprocessed = Buffer.alloc(0);
}

//////////////////////////////////////////// SenderBox ////////////////////////////////////////

function BoxSender (box) {
  var self = this;
  var keys;
  self.box = box;

  self._wireBuffers = []; 

  function pushBuffer(buffer) {
    var idx = self._wireBuffers.length;
    self._wireBuffers.push(Buffer.alloc(2));  
    if (buffer.length > 0) {
        self._wireBuffers.push(buffer);
    }
    self._wireBuffers[idx].writeInt16BE(buffer.length, 0);
  }

  keys = Object.keys(self.box);
  for (var i=0; i<keys.length; i++) {
    pushBuffer(Buffer.from(keys[i], 'utf8'));    
    pushBuffer(self.box[keys[i]]);
  }
  pushBuffer(Buffer.alloc(0));  
}

BoxSender.prototype.writeToTransport = function (transportWrite) {
  var self = this;
  for (var i=0; i<self._wireBuffers.length; i++) {
    transportWrite(self._wireBuffers[i]);
  }
 };

/////////////////////////////////// Server ////////////////////////////////////

//var net = require('net');
//var senderbox = require('./senderbox');
//var receiverbox = require('./receiverbox');
//var MapExt = require('./mapext');

var callback = { 
        fname : "", 
		connected : "",
		received : "",
        setcallback : function(data) { 
            this.fname =  data;
        },
		getcallback : function() { 
            return this.fname;
        },
		setconnected : function(data) { 
            this.connected =  data;
        },
		getconnected : function() { 
            return this.connected;
        },
		setreceived : function(data) { 
            this.received =  data;
        },
		getreceived : function() { 
            return this.received;
        },
} 

var errorObj = { 
        code : "",
		description: "",
        set_code : function(data) { 
            this.code =  data;
        },
		get_code : function() { 
            return this.code;
        },
		set_description : function(data) { 
            this.description =  data;
        },
		get_description : function() { 
            return this.description;
        },
		reset_error : function(){
			this.code = "";
			this.description = "";
		},
}

const ask = {
    ask : 0,
    get_ask	: function(){
	    this.ask += 1;
        if(this.ask > 256){
           this.ask = 1;
		}			
		return this.ask;
	}
}

var server = net.createServer(function (socket) {
  console.log('server connected');
  this.callback = callback.getcallback();
  br = new ReceiverBox(this.callback);
  this.reply = function(data) {
	  bx = new BoxSender(data);
      console.log('sending AMP box');
      bx.writeToTransport(function(data) {socket.write(data.toString('utf8')); });
	return;
  };

  socket.on('error', function(err) {
    console.log('An error has occured => ' + err);
  });

  socket.on('end', function() {
    console.log(br.box);
    console.log('client has disconnected');
  });
  
  socket.on('close', function() {
    console.log(br.box);
    console.log('server has closed');
  });
  
  socket.on('data', function(data) {
    br.dataReceived(data);
  });
  
});

var client = new function() { 
        this.clientport = ""; 
        this.clientaddress = "";
		this.connected = "";
		this.received = "";
		this.remoteCall = "";

        this.printInfo = function() { 
            console.log(this.clientport); 
            console.log(this.clientaddress); 
			console.log(this.connected);
			console.log(this.received);
        };
		
		this.remoteCall = function(mapdata1) {
			mapdata = commandmapping(mapdata1);
			var myCall = {};
			for (var [key, value] of mapdata) {
				myCall[key] = Buffer.alloc(String(value).length, String(value), 'utf8');
			}
			const entries = Object.entries(myCall);
			console.log("Outgoing Data => " + entries);
			var bx = new BoxSender(myCall);
			console.log('sending AMP box');
			bx.writeToTransport(function(myCall) {client.connection.write(myCall.toString('utf8')); });
		};
				
		this.start = function(){
		    this.connection = net.createConnection(this.clientport, this.clientaddress, function () {
				this.br = new ReceiverBox(checklist);  
			});
			this.connection.on('connect', function(data) {
				console.log("Connect to the server");
				client.connected();
			});
			this.connection.on('data', function(data) {
				this.br.dataReceived(data);
			});
			this.connection.on('end', function() {
				console.log(br.box);
				console.log('server disconnected');
			});	
	
			
		};
}

function checklist(data){
	for (const property in data) {
		if(property != '_answer'){
		    temp = data[property];
            tempbuf = Buffer.from(temp);
			if(tempbuf.length<2){
			    break;	
			}
            len1 = tempbuf.readInt16BE(0, 2);
			if(len1 + 2 < tempbuf.length){
			    arr = toArray(data[property]);
                data[property] = arr;						
			}					
		}
	}
	client.received(data);
}

function toArray(buf){
	var buflen = buf.length;
	offset = 0;
	flag = true;
	dataarray = []
	while(flag){
		len1 = buf.readInt16BE(offset, offset + 2);
		word = buf.slice(offset + 2, len1 + offset + 2);
		dataarray.push(String(word));
		offset = offset + 2 + len1;
 		if(offset >= buflen){
			flag = false
		}
	}
	return dataarray;
}

function fromArray(dataarray){
	var buf = Buffer.alloc(0);
	len = dataarray.length;
	for (i = 0; i < len; i++) {
		data = dataarray[i];
		lendata = data.length;
		var tempbuf = Buffer.alloc(2);
		var tempbuf1 = Buffer.from(data);
		tempbuf.writeInt16BE(lendata, 0);
		tempbuf = Buffer.concat([tempbuf, tempbuf1]);
		buf = Buffer.concat([buf, tempbuf]);
			//self._unprocessed = Buffer.concat([self._unprocessed, data]);
	}
	return buf.toString();
}

function commandmapping(map1){
	resultmap = new Map();
	var ask1 = String(ask.get_ask());
	resultmap.set('_ask', ask1);
	for (var [key, value] of map1) {
		if(key.toLowerCase() == "command"){
		    resultmap.set('_command', value);	
		}
		else{
		    if(typeof(value) == 'object'){
				value = fromArray(value);
            }
            else{
                value = String(value);
            }	
			resultmap.set(key, value);
		}
    }
	return resultmap;
}

module.exports = {
  server: server,
  callback: callback,
  errorObj: errorObj,
  client: client,
  BoxSender: BoxSender,
  ReceiverBox: ReceiverBox,
  Controller: Controller,
  CreateController: CreateController,
  factory: factory,
  AmpDate: AmpDate,
  CommandLocator: CommandLocator,
  Command: Command
};

//////////////////////////////////////////////////////////////////////////////