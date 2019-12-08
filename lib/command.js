/*
This files holds two classes:
1) CommandLocator which connects the user defined command class to 
   the data send over the amp network
2) Command class which holds basic functionality for user defined commands
   All custom commands must be derived from this class
*/

var MapExt = require('./mapext');
var server = require('./server');

/*
 Connects data with the user defined commands and intializes the custom classes.
 It uses the factory method design pattern to due this. 
 
 Parameters:
     this.commands - used for connection data with the custom commands
     this.callback - used for connection data with the callback for the commands
 Methods:
     Createcommand - is a factory method for creating an object of a custom defined command class
*/
class CommandLocator{
    constructor(factorycommands, factorycallbacks){
        this.commands = factorycommands;
		this.callback = factorycallbacks;
    }
	createcommand(commandtype, arguments1){
		try{             // commands['Add'](arguments, 'OnAdd')
	        return new this.commands[commandtype](arguments1, this.callback[commandtype]);
		}
		catch{
		    console.log("Invalid command: something happen over the wire");	
			return 0; 
		}
	}
}

/*
 This is the base class for command structure used to send/receive from wire
 All custom commands will be derived from this base class.
 
 Parameters:
   this.fn: holds the callback function for the custom command class 
   this.arguments: holds the variables that will be used for the custom command class
   this.response: holds the reply that will be sent from the custom command class
   See example (ampmath.js) to see the usage
   
 Methods:
   seterror: Set error that happens in the command class
   checkerror: Check if the custom class is in error conditions
   checkresponse: Check if the response object is in a correct format
   checkarguments: Check if the arguments object is in a correct format
   setarguments: Set the values of one arguments map to the other
   setresponse: Set the values of one arguments map to the other
   parsetype: Set the value to the right type
*/
class Command { 
    constructor(maparg, mapres, arguments1, fn ) { 
        this.fn = fn;
		this.arguments = maparg;
		this.response = mapres;
		//if (this.responder === undefined) {
        //   throw new Error('You have to implement the method responder!');
        //}
		var is_error = this.checkerror(maparg, mapres, arguments1);
		if(is_error){
			// Is an error command
		}
		else{
			// Is a custom command
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
	
	// Set error that happens in the command class
	seterror(code, description){
	    server.errorObj.set_code(code);
		server.errorObj.set_description(description);
	}
	
	/*
	  check if the custom class is in error conditions
	  1)check if the new command created was an error object
      2)check if arguments1 and maparg are empty
	*/
	checkerror(maparg, mapres, arguments1){
		var res1 = MapExt.MapExt.isEmpty(arguments1);
		var res2 = MapExt.MapExt.isEmpty(MapExt);
		var res3 = false;
		var result = false;
		var keyarray = Array.from(mapres.keys());
		// check if the keys of mapres are "_error", "_error_code" and "_error_description"
        if(keyarray[0] == "_error" || keyarray[1] == "_error_code" || keyarray[2] == "_error_description"){
			res3 = true;
		}
		if(res1==true && res2==true && res3 == true){
			result = true;
		}
        return result;
	} 
	
	// Check if the response object is in a correct format
	checkresponse(response){
		return MapExt.MapExt.compareMapsKeys(this.response, response);
	}
	
	//Check if the arguments object is in a correct format
	checkarguments(arguments1){
		return MapExt.MapExt.compareMapsKeys(this.arguments, arguments1);
	}
	
	// set the values of one arguments map to the other
	setarguments(arguments1){
		for (var [key, value] of arguments1) {
			var valuetype = this.arguments.get(key);
			var value1 = this.parsetype(valuetype, value);
			this.arguments.set(key, value1);
        }	
	}
	
	// set the values of one arguments map to the other
	setresponse(mapanswer, mapdata){
		var mapresponse = new Map([...mapanswer, ...mapdata]);
		for (var [key, value] of mapresponse) { 
			var valuetype = this.response.get(key);
			var value1 = String(value)
			this.response.set(key, value1); 
		}
	}
	
	// Set the value to the right type
	// To do: Must add type listof and Ampobj
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
			//value = String(value);
			if(value.length == 32){
			    //var value = new Date(value);
				var value = value;
			}
			else{
			    console.log("Not the right format for the datetime value");	
				this.seterror("160", "Not the right format for the datetime value");
			}
		}
		else if(valuetype == "list[string]"){
			//res = Array.isArray(value);
			//value = this.toArray(value);
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

module.exports = {
  CommandLocator: CommandLocator,
  Command: Command
};

/*
datetime:
%04i-%02i-%02iT%02i:%02i:%02i.%06i%s%02i:%02i
year (1-9999)
month (1-12)
day (1-31)
hour (0-23)
minute (0-59)
second (0-59)
microsecond (0-999999)
timezone direction (+ or -)
timezone hour (0-23)
timezone minute (0-59)

example:
1969-08-15T12:00:00.000000+00:00
2012-01-23T12:34:56.054321-01:23
*/