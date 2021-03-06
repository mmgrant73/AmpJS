var controller = require('../lib/controller');
var command = require('../lib/command');
var server = require('../lib/server');

// All custom amp command must be derived from the command class and have the structure shown below
class Echo extends command.Command {
	//Custom command Echo that will echo back to the client the data it receives
	constructor(receiveargs, funcallback) {    
		var argumentMap = new Map([['value', 'float']]);
		var respondsMap = new Map([['reply', 'float']]);
		super(argumentMap, respondsMap, receiveargs, funcallback);
		this.responder = funcallback;
	}
}

var OnEcho = function(maparg){
	console.log("OnEcho event has been trigger");
	var value = maparg.get('value');
	var echoreply = value;
	const reply = new Map([['reply', echoreply]]);
	return reply;
};

const factorycommands = {
    'Echo': Echo,
};

var factorycallbacks = {
	'Echo': OnEcho,
};

class doecho{
    constructor(){
		this.clientconn = server.client;
		this.clientconn.clientaddress = clientaddress;
		this.clientconn.clientport = clientport;
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
	    console.log('A connection has been established');
		var data = new Map([['command','Echo'], ['value', 3.142]]);
		server.client.remoteCall(data);
	}
	received(data){
	    console.log('Data has been received back from the server');
		const entries = Object.entries(data);
		const keys = Object.keys(data);
		//console.log("key - " + keys[0]);
		if(keys[0] == "_answer"){			
		    ResolveCommand(data['reply']);
		}
		else{
			RejectCommand(data);
		}
	}
}

function sendcommand(){
	var promise = new Promise(function(resolve, reject) { 
        com1 = new doecho();
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
			console.log('Finish with the command!')
		}); 
}

function CreateContoller(data){
	var con = new controller.Controller(data, factorycommands, factorycallbacks);
	if(server.errorObj.code == ""){
	    answer = con.run_responder();
	    con.from_command(answer);
	}
	else{
	    con.to_error(server.errorObj.code, server.errorObj.description);
	}
}

function processarg(){
    var myArgs = process.argv.slice(2);
	if(myArgs.length != 2){
		console.log("Invalid arguments, to run this app -> 'node testserver serverport clientport'");
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

processarg();
console.log("Client port is set to " + clientport);

/////// Start the server ////////
server.callback.setfname(CreateContoller);
server.server.listen(serverport, function() { 
   console.log('The AMP server is running on port ' + serverport);
   sendcommand();
});