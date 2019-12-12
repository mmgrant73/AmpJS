var ampjs = require('../lib/ampjs-min');

class Add extends ampjs.Command {
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

ampjs.factory.factorycommands = factorycommands;

const factorycallbacks = {
	'Add': OnAdd,
};

ampjs.factory.factorycallbacks = factorycallbacks;

/////// Start the server ////////
ampjs.callback.setcallback(ampjs.CreateController);
let serverport = 1234;
ampjs.server.listen(serverport, function() { 
    console.log('The AMP server is running on port ' + serverport);
});