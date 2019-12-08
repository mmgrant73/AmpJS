/* 
This file holds the controller class that process data and send data between the
ampboxs and the custom commands defined by the users
Controller acts like a middleman between Amp box and Commands
AMP Box <---> Controller <---> Commands
It process and store data so it can be read/written to the ampbox and the commands
*/

var net = require('net');
//var sendreceive = require('./sendreceive');
var command = require('./command');
var server = require('./server');

var factory = { 
    factorycommands : "", 
	factorycallbacks : "",
}


function CreateController(data){
	var con = new Controller(data, factory.factorycommands, factory.factorycallbacks);
	if(server.errorObj.code == ""){
	    answer = con.run_responder();
	    con.from_command(answer);
	}
	else{
	    con.to_error(server.errorObj.code, server.errorObj.description);
	}
}

/*
let CreateController = function(data) {
  var con = new Controller(data, factory.factorycommands, factory.factorycallbacks);
	if(server.errorObj.code == ""){
	    answer = con.run_responder();
	    con.from_command(answer);
	}
	else{
	    con.to_error(server.errorObj.code, server.errorObj.description);
	}
};
*/

class Controller { 
    constructor(data, factorycommands, factorycallbacks) {
		/*
		Constructor for the controller class
		 
		Parameters:
			data(str) - Holds the raw data that came from the wire
			factorycallbacks(obj) - Links the custom amp command to its callback function
			factorycommands(obj) - Links the custom command send over the wire to its custom class
			arguments(map) - holds the data for the variables passed over on the wire
			locator(Command) - holds the custom command object that was passed over the wire
			ask, command, answer, error, error_code, error_description are
			commands that are used by the Amp protocol to handle flow of data
		*/
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
		// Parse the data and store in an object as a key/value pair
		this.parsedata()
		// The locator will stored an object of the custom command class
		this.locator = this.to_command()
    } 
   
    get data() {
		// Getter for the data in its raw form
        return this._data;
    }

    set data(newdata) {
		// Setter for data
        this._data = newdata; 
    }
	
	get ask() {
		// Getter for the ask key used in amp protocol
        return this._ask;
    }

    set ask(newdata) {
		// Setter for ask
        this._ask = newdata;  
    }
	
	get answer() {
		// Getter for the ask key used in amp protocol
        return this._answer;
    }

    set answer(newdata) {
		// Setter for answer
        this._answer = newdata;  
    }
	
	get command() {
		// Getter for the ask key used in amp protocol
        return this._command;
    }

    set command(newdata) {
		// Setter for command
        this._command = newdata;  
    }
	
	get error() {
		// Getter for the error key used in amp protocol
        return this._error;
    }

    set error(newdata) {
		// Setter for error
        this._error = newdata;  
    }
	
	get error_code() {
		// Getter for the error_code key used in amp protocol
        return this._error_code;
    }

    set error_code(newdata) {
		// Setter for error_code
        this._error_code = newdata;  
    }
	
	get error_description() {
		// Getter for the error_description key used in amp protocol
        return this._error_description;
    }

    set error_description(newdata) {
		// Setter for error_description
        this._error_description = newdata;  
    }
	
	parsedata(){
	    // parse the given data into parts: commandname, arguments, dict pairs	
		Object.entries(this.data).forEach(entry => {
            let key = entry[0];
            let value = entry[1];
            //use key and value here
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
				//var res = this.checkkey(key, value);
				//if(!res){
					this.arguments.set(key, value);
				//}
		    }
        });
    }
	
	checkkey(key, value){
		// Check if the value of the key is an array and if so add to it
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
		// connect the custom command to a callback function for the command
		return this.locator.responder(this.locator.arguments);
	}
	
	to_command(){
		// Get the data sent over the wire and pass it to the custom command class
		let customlocator = new command.CommandLocator(this.factorycommands, this.factorycallbacks);
		let com = customlocator.createcommand(this.command, this.arguments);
		if(com==0){
			this.to_error("111","the incoming data has been corrupted");
			//return 0
		}
		else{
		    return com
		}
    }
	
	from_command(mapdata){
	    // get data from a command class to send to messagebox
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
		// Reverse the order of an object properties
		var new_obj = {};
		let rev_obj = Object.keys(obj).reverse();
		rev_obj.forEach(function(i) { 
		    new_obj[i] = obj[i];
		})
		return new_obj;
	}
	
	to_error(error_code, error_description){
		// Sets up an error message to be sent over the network
		this.error = String(this.ask);
		this.error_code = error_code;
		this.error_description = error_description;
		var maperror = new Map([["_error", this.error], ["_error_code", this.error_code], ["_error_description", this.error_description]]);
		var errorobj = {};
		errorobj["_error"] = Buffer.alloc((String(this.error).length), String(this.error), 'utf8');
		errorobj["_error_code"] = Buffer.alloc((String(this.error_code).length), String(this.error_code), 'utf8');
		errorobj["_error_description"] = Buffer.alloc((String(this.error_description).length), String(this.error_description), 'utf8');
		server.server.reply(errorobj);
	}
	
	to_box(data){
	    // send data to the senderblock class to send over network
		var map1 = this.locator.response;
		var replyCall = {};
       //replyCall._answer.writeInt16BE(49, 0);
		for (var [key, value] of map1) {
		   	replyCall[key] = Buffer.alloc((String(value).length), String(value), 'utf8');
		}
		var res = this.dict_reverse(replyCall);
		const entries = Object.entries(res);
		console.log("replycall => " + entries );
		server.server.reply(res);
		//server.server.reply(replyCall);
	}
	
	from_box(data){
	    // receive data from the receivemessage class and parse the data	
	}
}

module.exports = {
  Controller: Controller,
  CreateController: CreateController,
  factory: factory,
};