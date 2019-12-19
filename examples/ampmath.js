/* 
  AmpJS - is a library/framework to send/receive data over a TCP network using the Amp Protocol
  Written by Matthew Grant @ 2019.  It is free to use and modify under the l

  Structure of Library:
  Ampbox - is an object that holds data that is sent/receive over the network
  senderbox.js - handles sending ampboxes over the amp network
  receiverbox.js - handles receiving ampboxes over the amp network
  controller.js - Holds the controller class which take/receive data from the network
                  process it.  It acts like the middle man bewteen Ampbox and the custom
				  command classes.  AmpBox <--> Controller <--> Command
  command.js - Hold two classes: commandlocator and command.  Commandlocator receives data
               from the Controller and initializes the correct custom command classes and 
			   connects the callback function for the custom class.  The command class holds
			   the basic structure for commands.  All custom commands needs to be derived 
			   from this class
  server.js - is responsible for opening a server and sending/receiving data from other nodes
  mapext.js - is an extention of the map class that provides extra functionality over the 
              standard map class.
  ampdate.js - is an extention of the date class.  It provides a function called toAmpDate()
               that is used to output a string in ISO 8061 format that the amp network uses
			  
  There is also a minification, compressed version that holds all the above files in one
  small file (about 5kb in size) called AmpJS.js
			  
  Example usage of this library can be seen in the amptest.py file.  It demostrates how to
  derive custom command class.  It shows how to start the network up so one can send/receive
  data over the network.
  
  To run the example: node amptest.js serverport clientport
  serverport - is the port that this program will open the server and listen for connects
  clientport - is the port of the client program that you want to connect to and send commands
  Example: Open two terminals
           First terminal type 'node amptest.js 2000 3000'
		   Second terminal type 'node amptest.js 3000 2000'
  Then go to either window and it will prompt you for a command. In this case (Add, Sub, Mul, Div, exit)
  Then it will prompt you for variable A and B.  Once it got this data it will send it over to the other node

  To get an amp network up and running. You must do these five items.
  
  1) Define a custom command class derived from the Command Class 
  which holds the basic structure for the custom command: Its 
  variables(a map that holds variable name: variable type)
  and the structure of the responds the structure of the reply message
  (a map that holds variable name: variable type).  See the Add, Sub,
  Mul, and Div command class below to see how it should be structured.
  
  2) Define a callback function for each custom command class.  This is 
  where the data received from the wire will be sent to and process.  See
  OnAdd, OnSub, OnMul, and OnDiv functions for example. (Command design pattern)
  
  3) Define a factorycommands object.  That connects the command sent over
  the wire to its custom command class.  Its works like a factory method
  design pattern. See example below.
  
  4) Define a factorycallbacks object.  That connects the custom command
  class to its callback function.  See example below
  
  5) The last things is to define a port and start the server. (Server.listen)
  See example below.
  
  To send data to a client node one simply calls the senddata command
  senddata(command, a, b, clientaddress, clientport)
*/

const prompt = require('prompt');
var controller = require('../lib/controller');
var command = require('../lib/command');
var server = require('../lib/server');

class _Error extends command.Command {
    constructor(receiveargs, funcallback) {
		var arguments1 = new Map(); 
		var maparg = new Map();
		var mapres = new Map([['_error', 'string'], ['_error_code', 'string'], ['_error_description', 'string']]);
		super(maparg, mapres, receiveargs, _OnError);
		this.responder = _OnError;
    }		
}

// All custom amp command must be derived from the command class and have the structure shown below
class Add extends command.Command {
	//Custom command Add that adds two variables a + b and returns the total = a + b
	constructor(receiveargs, funcallback) { 
	    /*
		argumentMap -  will consist of variable name and type stored in an Array
		respondsMap - will be consist of variable and type stored in an array
		receiveargs - Holds a map of variables that was received from the wire
		responder property holds the callback function when this custom command is invoke
		funcallback - is the callback function that will trigger when this command is called
		*/    
		//Map(['a', 'array[string]'])  => Command a = ['matt', 'monroe', 'grant'] 
		// over the wire _command; Add, a; 'matt', a; 'monroe', a; 'grant' 
		var argumentMap = new Map([['a', 'integer'], ['b', 'integer']]);
		var respondsMap = new Map([['total', 'integer']]);
		super(argumentMap, respondsMap, receiveargs, funcallback);
		this.responder = funcallback;
	}
}

class Sub extends command.Command {
	//Custom command Sub that subtracks two variables a - b and returns the total = a - b
	constructor(arguments1, fn) { 
		var argArray = [['a', 'integer'], ['b', 'integer']];
		var resArray = [['total', 'integer']]
		var maparg = new Map(argArray);
		var mapres = new Map(resArray);
		super(maparg, mapres, arguments1, fn);
		this.responder = fn;
	}
}

class Mul extends command.Command {
	//Custom command Mul that multiply two variables a * b and returns the total = a * b
	constructor(arguments1, fn) { 
		var argArray = [['a', 'integer'], ['b', 'integer']];
		var resArray = [['total', 'integer']]
		var maparg = new Map(argArray);
		var mapres = new Map(resArray);
		super(maparg, mapres, arguments1, fn);
	    //this.arguments = new Map(argArray);
		//this.responds = new Map(resArray);
		this.responder = fn;
	}
}

class Div extends command.Command {
	constructor(arguments1, fn) {
		//Custom command Div that divides two variables a / b and returns the total = a / b
		var argArray = [['a', 'integer'], ['b', 'integer']];
		var resArray = [['total', 'integer']]
		var maparg = new Map(argArray);
		var mapres = new Map(resArray);
		super(maparg, mapres, arguments1, fn);
	    //this.arguments = new Map(argArray);
		//this.responds = new Map(resArray);
		this.responder = fn;
	}
}

var _OnError = function(maparg){
	// Error method that happens in the amp protocol
	console.log('Error event has happened');
	var error = maparg.get('_error');
	var error_code = maparg.get('_error_code');
	var error_description = maparg.get('_error_description');
	const reply = new Map([['_error', error], ['_error_code', error_code], ['_error_description', error_description]]);
	console.log(reply);
	return reply;
}


/*
 For every custom command that you create you must create a callback function
 that will trigger when data is received for this custom class.  This callback
 function will handle processing data and sending back a reply.  The basic 
 structure for the callback function is shown below
*/
var OnAdd = function(maparg){
	/*
	User defined method that does addition on two passed variables
    Callback function that is invoke when the Add command has be sent.
	The variables that you defined in the custom class will have to be
	grabbed from the maparg, processed and return.  The return map must
	match the one you defined in the custom class
	*/
	console.log("OnAdd event has been trigger");
	var a = maparg.get('a');
	var b = maparg.get('b');
	var answer = a + b;
	const reply = new Map([['total', answer]]);
	return reply;
};

var OnSub = function(maparg){
	/*
	User defined method that does subtraction on two passed variables
    Callback function that is invoke when the Sub command has be sent
	*/
	console.log("OnSub event has been trigger");
	var a = maparg.get('a');
	var b = maparg.get('b');
	var answer = a - b;
	const reply = new Map([['total', answer]]);
	return reply;
};

var OnMul = function(maparg){
	/*
	User defined method that does multiplication on two passed variables
	Callback function that is invoke when the Mul command has be sent
	*/
	console.log("OnMul event has been trigger");
	var a = maparg.get('a');
	var b = maparg.get('b');
	var answer = a * b;
	const reply = new Map([['total', answer]]);
	return reply;
};

var OnDiv = function(maparg){
	/*
	User defined method that does division on two passed variables
    Callback function that is invoke when the Div command has be sent
	*/
	console.log("OnDiv event has been trigger");
	var a = maparg.get('a');
	var b = maparg.get('b');
	var answer = a / b;
	const reply = new Map([['total', answer]]);
	return reply;
};

/*
   The factorycommands object must be defined as shown below and sent to the controller
   class.  This object connects the command sent over the file to the custom command
   class that defines its arguments and response structure
*/
var factorycommands = {
    'Add': Add,
    'Sub': Sub,
    'Mul': Mul,
    'Div': Div	
};

controller.factory.factorycommands = factorycommands;
/*
   The factorycallbacks object must be defined as shown below and sent to the controller
   class.  This object connects the custom command to its callback function when it 
   receives data from the wire.
*/
var factorycallbacks = {
	'Add': OnAdd,
    'Sub': OnSub,
    'Mul': OnMul,
    'Div': OnDiv
};

controller.factory.factorycallbacks = factorycallbacks;
/*
 All client calls can be handle using the pattern shown below:
Set server.client.clientaddress to the host Ip address of the peer you want to connect to
Set server.client.clientport to the port of the host that you want to connect to
Set server.client.connected to the function that will be callback when you make a connection
Set server.client.received to the callback function that will be ran when data is received from the host
The connected callback function you need to call server.client.remoteCall to send the command to the host
The received callback function you need to call ResolveCommand to resolve the promised set when this class 
is initailized.  Make sure you set ResolveCommand to resolve as shown above. 
*/
class doadd{
    constructor(){
		this.clientconn = server.client;
		this.clientconn.clientaddress = clientaddress;
		this.clientconn.clientport = clientport;
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
	    console.log('A connection has been established');
        //['command','Add'], ['var1',10], ['var2',20] => ['_ask',ask], ['_command','Add'], ['a', aVar], ['b', bVar]
		//var data = new Map([['_ask',ask], ['_command','Add'], ['a', aVar], ['b', bVar]]);
		var data = new Map([['command','Add'], ['a', aVar], ['b', bVar]]);
		server.client.remoteCall(data);
	}
	received(data){
	    console.log('Data has been received back from the server');
		const entries = Object.entries(data);
		const keys = Object.keys(data);
		//console.log("key - " + keys[0]);
		if(keys[0] == "_answer"){
			if(data['total'] == NaN){
				server.errorObj.set_code("151");
				server.errorObj.set_description("The response data is not right");
			}
			else{
		        //console.log("data - " + data['total']);
		        ResolveCommand(data['total']);
			}
		}
		else{
			RejectCommand(data);
		}
	}
}

class dosub{
    constructor(){
		this.clientconn = server.client;
		this.clientconn.clientaddress = '127.0.0.1';
		this.clientconn.clientport = 2000
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
	    console.log('A connection has been established');
        //console.log("a - " + aVar + "b - " + bVar);	
		var data = new Map([['_ask','1'], ['_command','Sub'], ['a', aVar], ['b', bVar]]);
		//var data = new Map([['_command','Sub'], ['a', aVar], ['b', bVar]]);
		server.client.remoteCall(data);
	}
	received(data){
	    console.log('Data has been received back from the server');
		//const entries = Object.entries(data)
		//console.log("data - " + data['total']);
		ResolveCommand(data['total']);
	}
}

class domul{
    constructor(){
		this.clientconn = server.client;
		this.clientconn.clientaddress = '127.0.0.1';
		this.clientconn.clientport = 2000
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
	    console.log('A connection has been established');
        //console.log("a - " + aVar + "b - " + bVar);	
		var data = new Map([['_ask','1'], ['_command','Mul'], ['a', aVar], ['b', bVar]]);
		server.client.remoteCall(data);
	}
	received(data){
	    console.log('Data has been received back from the server');
		//const entries = Object.entries(data)
		//console.log("data - " + data['total']);
		ResolveCommand(data['total']);
	}
}

class dodiv{
    constructor(){
		this.clientconn = server.client;
		this.clientconn.clientaddress = '127.0.0.1';
		this.clientconn.clientport = 2000
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
	    console.log('A connection has been established');
        //console.log("a - " + aVar + "b - " + bVar);	
		var data = new Map([['_ask','1'], ['_command','Div'], ['a', aVar], ['b', bVar]]);
		server.client.remoteCall(data);
	}
	received(data){
	    console.log('Data has been received back from the server');
		//const entries = Object.entries(data)
		//console.log("data - " + data['total']);
		ResolveCommand(data['total']);
	}
}

function sendcommand(command){
    if(command=="Add"){
		var promise = new Promise(function(resolve, reject) { 
            com1 = new doadd();
		    com1.clientconn.start();
			ResolveCommand = resolve;
			RejectCommand = reject;
        }) 
        promise. 
           then(function (data) { 
			  console.log("Data received from Command => " + data);
            }). 
            catch(function (data) { 
                console.log('Some error has occured');
			    const values = Object.values(data);
				console.log("[Error] - " + values)
				server.errorObj.reset_error();
            }).
		    finally(function (){
				// This block has no effect on the return value.
				console.log('All done!')
				getinput();
			}); 
    }	
    
    else if(command=="Sub"){
		var promise = new Promise(function(resolve, reject) { 
            com1 = new dosub();
		    com1.clientconn.start();
			ResolveCommand = resolve;
        }) 
        promise. 
           then(function (data) { 
			  console.log("Data received from Command => " + data);
            }). 
            catch(function () { 
                console.log('Some error has occured'); 
            }).
		    finally(function (){
				// This block has no effect on the return value.
				console.log('All done!')
				getinput();
			}); 
    }	
	
	else if(command=="Mul"){
		var promise = new Promise(function(resolve, reject) { 
            com1 = new domul();
		    com1.clientconn.start();
			ResolveCommand = resolve;
        }) 
        promise. 
           then(function (data) { 
			  console.log("Data received from Command => " + data);
            }). 
            catch(function () { 
                console.log('Some error has occured'); 
            }).
		    finally(function (){
				// This block has no effect on the return value.
				console.log('All done!')
				getinput();
			}); 
    }	
	
	else if(command=="Div"){
		var promise = new Promise(function(resolve, reject) { 
            com1 = new dodiv();
		    com1.clientconn.start();
			ResolveCommand = resolve;
        }) 
        promise. 
           then(function (data) { 
			  console.log("Data received from Command => " + data);
            }). 
            catch(function () { 
                console.log('Some error has occured'); 
            }).
		    finally(function (){
				// This block has no effect on the return value.
				console.log('All done!')
				getinput();
			}); 
    }	
	
	else{
	    console.log("Not a valid command!!");	
	}
}
/*
  The port must be define, the initial callback function must be define and
  the listening method from the server class must be defined as shown below
  to start the amp server on the supplied port
*/

function processarg(){
    var myArgs = process.argv.slice(2);
	if(myArgs.length != 2){
		console.log("Invalid arguments, to run this app -> 'node ampserver serverport clientport'");
		process.exit();
	}
	try{
	    serverport = parseInt(myArgs[0]);
	    clientport = parseInt(myArgs[1]);
	}
	catch(err){
	    console.log("The serverport and clientport must be a number bewteen 0 and 65535");	
		process.exit();
	}
}

var ResolveCommand = undefined;
var RejectCommand = undefined;
var serverport = 1234;
var clientport = 4321;
var clientaddress = '127.0.0.1';
var aVar = 9;

processarg();
console.log("Client port is set to " + clientport);

/////// Start the server ////////
server.callback.setcallback(controller.CreateController);
server.server.listen(serverport, function() { 
   console.log('The AMP server is running on port ' + serverport);
   getinput();
});

/*
 Below is used to get user input for demostration
*/

var schema = {
    properties: {
      command: {
		description: 'Enter the Command',   
        type: 'string', 
        pattern: /Add|Sub|Mul|Div|exit/,
        message: 'Command must be Add, Sub, Mul, Div or exit',
		default: 'Add',
        required: true
      },
      A: {
        description: 'Enter the Value for Variable A',
		type: 'integer', 
        pattern: /[0-9]*/,
		default: '1',
		ask: function() {
          // only ask if command is not exit
          return prompt.history('command').value != 'exit';
        }
      },
	  B: {
        description: 'Enter the Value for Variable B',
		type: 'integer', 
        pattern: /[0-9]*/,
		default: '2',
		ask: function() {
          // only ask if command is not exit
          return prompt.history('command').value != 'exit';
        }
      }
    }
  };

prompt.message = "AMP";
prompt.delimiter = ">";

prompt.start();


function getinput(){
	commandarray = ['Add', 'Sub', 'Mul', 'Div'];
	console.log("Commands (Add, Sub, Mul, Div, exit)");
	prompt.get(schema, function (err, result) { //['command', 'A', 'B']
		if (err) { return onErr(err); } 
		if (result.command.toLowerCase() == "exit"){
			console.log("Shutting down, exiting the app");
		    process.exit();
		}
		else if(commandarray.includes(result.command)){ 
			x = isNaN(result.A);
			y = isNaN(result.B);
			if(x == true || y == true){
			    console.log("The variable A and B must be a integer");
			}
			else{
			    console.log("Sending Command => " + result.command + "(a=" + result.A + ", b=" + result.B + ")");				
				aVar = parseInt(result.A);
				bVar = parseInt(result.B);
				sendcommand(result.command);
			}
		}	
		else{
			console.log("Invalid command!");
		}
	});
    //prompt.stop();
}

function onErr(err) {
    console.log(err);
    return 1;
}

