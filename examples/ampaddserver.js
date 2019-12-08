
 var controller = require('../lib/controller');
var command = require('../lib/command');
var server = require('../lib/server');

class Add extends command.Command {
	//Custom command Add that adds two variables a + b and returns the total = a + b
	constructor(receiveargs, funcallback) {     
		var argumentMap = new Map([['a', 'integer'], ['b', 'integer']]);
		var respondsMap = new Map([['total', 'integer']]);
		super(argumentMap, respondsMap, receiveargs, funcallback);
		this.responder = funcallback;
	}
}

var OnAdd = function(maparg){
	console.log("OnAdd event has been trigger");
	var a = maparg.get('a');
	var b = maparg.get('b');
	var answer = a + b;
	const reply = new Map([['total', answer]]);
	return reply;
};

const factorycommands = {
    'Add': Add,	
};

controller.factory.factorycommands = factorycommands;

const factorycallbacks = {
	'Add': OnAdd,
};

controller.factory.factorycallbacks = factorycallbacks;

/////// Start the server ////////
server.callback.setcallback(controller.CreateController);
let serverport = 1234;
server.server.listen(serverport, function() { 
    console.log('The AMP server is running on port ' + serverport);
});