AmpJS
=====

**What is AmpJS?**
AmpJS is a framework for using the AMP protocol using NodeJS(Javascript).  I tried to make it as user friendly
as possible.  Also, I tried to mimic how it is implemented in Twisted Library for Python.  Thus, if you have ever 
used that library, it should make it easy to use AmpJS.

|

**What is the Amp Protocol?**
AMP (Asynchronous Messaging Protocol) is a flexible Remoting protocol for sending multiple asynchronous 
request/response pairs over the same connection. Requests and responses are both collections of unordered key/value pairs.
It's a communcation layer build on top off the TCP layer. See https://amp-protocol.net/ for a formal discription of 
this protocol.

|

**Data types of the Amp Protocol (as used by this framework)?**
Data are transport as key/value pairs across the TCP network.  They are in byte format encoded to 'UTF-8' and the framework
will transform the bytes stream to the approiated datatype on each end of the connections
There are five basic types:

1. String
2. Integer
3. Boolean
4. Datetime
5. Float

There are two compound types:

1. Listof - this is basically an array/list of a certain basic data type(ie - an array[string]).  They must be the same data type
2. AmpList - * this is not implemented yet but as soon as I have time I will add this

*Sample Amp Communcation:*
Let's assume that you created a Sum command that will add two number.  The data that is sent/received are data object that are called ampboxes
Client will send: 

|

+-----------+--------+
| Key       | Value  |
+===========+========+
| _ask      |  42    |
+-----------+--------+
| _command  | Sum    |
+-----------+--------+
| a         | 13     |
+-----------+--------+
| b         | 81     |
+-----------+--------+

|

The server will take this data add the two variables and return the results as shown below

|

+----------+--------+
| Key      | Value  |
+==========+========+ 
| _answer  | 42     |
+----------+--------+
| total	   | 94     |
+----------+--------+

|

See https://amp-protocol.net/conversations.html for a more indept description on how this works

|

**Structure of the AmpJS framework?**
This framework consist of seven files: (All these files are in the lib folder)

1. Controller.js - The controller class receives/sends data between the ampboxes and the commands and transform it to the right type of data type.  It acts like a middle man between ampboxes and commands (Ampboxes<-->controller<-->commands)  
2. Command.js - This class holds the basic functionality of commands that will be handle back the Amp network.  All custom commands must be dervied from this class.  See below to see how this is done.
3. Server.js - This sets up network connections (TCP).  It will take data from the senderbox and rely it across the network.  It will receive Ampbox from the network and rely it to the receiverbox
4. Receiverbox.js - This handles receiving ampbox over the amp network.
5. Senderbox.js - This sends out ampboxes (data object) of the Amp network. 
6. Mapext.js - Is an extention of the map class.  It holds custom map function needed by the framework. 
7. AmpDate.js - Is an extention of the Date class.  It has a toAmpDate() function that output a string formatted date that can be sent over the Amp network

**How to use this AmpJS framework to create your own custom commands and developed your own Amp network?**

1. **First you must include the following at the top of your program:**

|        var controller = require('./lib/controller');
|        var command = require('./lib/command');
|        var server = require('./lib/server');

2. **Then you need to create your custom command classes. Remember it must be dervied from the command class. It consists of variables that will be sent over to the server and the responds that is expected from the server.  See below to see how this is done**

| class Add extends command.Command {
|	//Custom command Add that adds two variables a + b and returns the total = a + b
|	constructor(receiveargs, funcallback) {     
|		var argumentMap = new Map([['a', 'integer'], ['b', 'integer']]);
|		var respondsMap = new Map([['total', 'integer']]);
|		super(argumentMap, respondsMap, receiveargs, funcallback);
|		this.responder = funcallback;
|	}
| }

You can used this as a template for any of your custom class.  The argumentmap holds the variable name along with its expected datatype.  This will be send over the network to the server. The server will reply with the respondsMap will is the return variable and its expected datatype.  The receiveargs holds a map of what the actually value that each variable will be set to.  And the funcallback is the callback function that will be called when
the client gets a reply back.

3. **Then you must define your callback function that will handle the data that the server will send back to the client. See below**

|	var OnAdd = function(maparg){
|		console.log("OnAdd event has been trigger");
|		var a = maparg.get('a');
|		var b = maparg.get('b');
|		var answer = a + b;
|		const reply = new Map([['total', answer]]);
|		return reply;
|	};

This is what the server will do with the data that it has received from the client.  In this case it will add the two variables (a + b) and send back a reply that matches the respondsMap from step two back to the client

4. **Then you must create two object: One that holds a the name of the command with the actually custom command and the other object holds the command name
and the callback function that is connected to this custom command class.  You need two add both object to the controller.factory.  Lastly, you need to
set the server.callback to controller.CreateController.  Don't forget these as the controller depends on these settings and will not work without them.  See below**

| const factorycommands = {
|    'Add': Add,	
| };
| controller.factory.factorycommands = factorycommands;
|
| const factorycallbacks = {
|	'Add': OnAdd,
| };
| controller.factory.factorycallbacks = factorycallbacks;
| 
| server.callback.setcallback(controller.CreateController);

This is used by the controller to initalized the correct custom class and the correct callback function.  It's a factory method design pattern (Is a function that takes some
data and create a type of class basic on the data.  Also, of notethe command design pattern is also used by the controller to separated the invoker of a function from the actually implementation of the function. 

5. **Then you must create a client function that can call custom commands from the server.  Look below to see how this done**

|	class doadd{
|		constructor(){
|			this.clientconn = server.client;
|			this.clientconn.clientaddress = clientaddress;
|			this.clientconn.clientport = clientport;
|			this.clientconn.connected = this.connected;
|			this.clientconn.received = this.received;
|		}
|		connected(){
|			console.log('A connection has been established');
|			var ask = String(server.ask.get_ask());
|			var data = new Map([['_ask',ask], ['_command','Add'], ['a', aVar], ['b', bVar]]);
|			//var data = new Map([['_command','Sub'], ['a', aVar], ['b', bVar]]);
|			server.client.remoteCall(data);
|		}
|		received(data){
|			console.log('Data has been received back from the server');
|			const entries = Object.entries(data);
|			const keys = Object.keys(data);
|			if(keys[0] == "_answer"){
|				if(data['total'] == NaN){
|					server.errorObj.set_code("151");
|					server.errorObj.set_description("The response data is not right");
|				}
|				else{
|					ResolveCommand(data['total']);
|				}
|			}
|			else{
|				RejectCommand(data);
|			}
|		}
|	}

The clientaddress is the IP address of the server you are connecting to.  The clientport is the port of the server you will be connecting to. The connected 
vairable will hold the callback function that is called when an connection has been established (in the above case it is also called connected.  The received
variable will hold the callback function that is called when data has been received back from the server (in the above case it is also called received.
The ResolveCommand holds the resolve method by the promise that called this class.  The RejectedCommand holds the reject method by the promised that called
this class.  See next step on how to write a promise to call this client class.

6. **Write a promise that calls the client command**

|	var promise = new Promise(function(resolve, reject) { 
|            com1 = new doadd();
|		    com1.clientconn.start();
|			ResolveCommand = resolve;
|			RejectCommand = reject;
|       }) 
|       promise. 
|          then(function (data) {  
|			  console.log("Data received from Command => " + data);
|           }). 
|           catch(function (data) { 
|               console.log('Some error has occured');
|			    const values = Object.values(data);
|				console.log("[Error] - " + values)
|				server.errorObj.reset_error();
|           }).
|		    finally(function (){
|				// This block has no effect on the return value.
|				console.log('All done!')
|			}); 

Above is the basic structure of a promise that calls your custom command class (doadd).  You can used this as the basic template.  You want to use a promise
because this is communicating over the network and you don't want to having a blocking call as it can take a certain length of time before you receive a reply back from the client

7. **The last thing that you need to do is start the server on a certain port so that it can listen for commands.  See below.**

|	/////// Start the server ////////
|   let serverport = 1234;
|	server.server.listen(serverport, function() { 
|	   console.log('The AMP server is running on port ' + serverport);
|	});

These seven steps is all you need to set up your own custom amp network.  There is an example program that has these exact seven steps.  It's located in the example folder: ampaddserver.js and ampaddclient.js
To run these program open two terminal windows.  In one of the window type in 'node ampaddserver.js' and in the other window type in 'node ampaddclient.js' 

|
 
There is another example program called Ampmath.js under the examples folder.  This program allows you to run basic math function across the amp network (Add, Sub, Mul, Div) 
To run this demostration program open two terminal windows.  Open one of the window and use the command node amptest serverport otherport.  The serverport is the port that 
this program will be using for its server connection and the otherport is the port for the program that you will be running in the second terminal window.  In other
words you can type in the first terminal window 'node amptest.js 1000 2000' and in the second window yout can type 'node amptest.js 2000 1000'.  From either terminal windows
you will be able to run commands that connect with the other terminal window.  It will tell you what commands that you can use and how to use it. *Note* this example program
uses prompt module which can be installed with npm: npm install prompt.  This is not needed for your program.  I used it in the example program to capture user inputs.

|

Furthermore, under the tests folder there are programs that I used to test out the different Amp datatypes.  They will demostrate how to use the different amp datatype.
    
| 
	
**Note:**  This started off as a fork of Ying Li project located here https://github.com/cyli/node-amp. I needed a javacript library that implemented the amp protocol for a project that i was
working on.  It was the only one that I could find but it only handle a small part of the amp protocol (just the communication over the wire) and I need a more
robust solution so I decided to add to it.  But I realized that there was a fatal flaw on how he was receiving data from the network.  He tried 
to cature data on the fly but did not take into account that data could be received as vastly different timeframes(It had a tendency to duplicate data and corrupted the data.  To make a long story short, at the ended, I dumped 
his receiving function and rewrote it so that it was stable.  By waiting to receive all the data before processing it.  I did keep his senderbox function as I didn't 
see anything wrong with it.  You can see the source file to see his contribution.  His file consisted of two functions: Recieverbox and Senderbox.  The receiverbox is what 
I dropped and rewrote from scratch.  I did make some minor changes in his senderbox function too to bring the code up to date.  He had some deprecated function that needed to be fix.    