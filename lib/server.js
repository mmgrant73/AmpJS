/*
  This file holds the following classes:
  1) Server Class that handles opening, listening, sending/receiving data 
  2) Client Class that handles sending commands to a remote server
  3) ErrorObj Class stores data from error when they occured
  4) Ask class holds the uniqueID for each send command.  It starts at 1 and
     is incremented by one each time a new command is sent.  When it reaches 256
	 it will reset by to 1.
*/

var net = require('net');
var senderbox = require('./senderbox');
var receiverbox = require('./receiverbox');
var MapExt = require('./mapext');

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
/*
var factory = { 
    factorycommands : "", 
	factorycallbacks : "",
}

function CreateController(data){
	var con = new controller.Controller(data, factory.factorycommands, factory.factorycallbacks);
	if(server.errorObj.code == ""){
	    answer = con.run_responder();
	    con.from_command(answer);
	}
	else{
	    con.to_error(server.errorObj.code, server.errorObj.description);
	}
}

console.log("got here");
var cb = CreateController;
console.log(cb);
callback.setfname(cb);
*/

// Holds error data when they are occur
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

// Unique ID for commands sent over the network
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

/* 
Handles server functionality
Parameters:
	this.callback: holds the callback function that will be called when 
	               data is received from the AmpBox
Methods:
    this.reply:  Sends a reply back to the client
*/
var server = net.createServer(function (socket) {
  console.log('server connected');
  this.callback = callback.getcallback();
  //console.log("callback -> " + this.callback);
  //When data is received from the amp box the callback function is invoked
  br = new receiverbox.ReceiverBox(this.callback);
  // The reply method sends a reply back to client
  this.reply = function(data) {
	  bx = new senderbox.BoxSender(data);
      console.log('sending AMP box');
      bx.writeToTransport(function(data) {socket.write(data.toString('utf8')); });
	return;
  };

  // this event is called when there is an error
  socket.on('error', function(err) {
    console.log('An error has occured => ' + err);
  });

  // this event is called when the client disconnects
  socket.on('end', function() {
    console.log(br.box);
    console.log('client has disconnected');
  });
  
  // this event is called when the server is closed
  socket.on('close', function() {
    console.log(br.box);
    console.log('server has closed');
  });
  
  //this event is called when data is received from client
  socket.on('data', function(data) {
    br.dataReceived(data);
  });
  
});

/* 
The client class is used to send commands to a remote server
Parameters:
	clientport:  The port of the remote server
	clientaddress: The IP address of the remote server
	connected: Holds the callback function when the server is connected 
	received: Holds the callback function when data is received by the server
Methods:
    remoteCall: Sends a command to the remote server
	start: Tells the client to start the connection with the server
*/
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
		
		//Sends a command to a remote server
		this.remoteCall = function(mapdata1) {
			//map1 = new Map([[['_ask','1']]]);
			//mapdata = MapExt.MapExt.mergeMaps(data, map1);
			//const entries = Object.entries(mapdata)
			//console.log("reply = " + entries);
			mapdata = commandmapping(mapdata1);
			var myCall = {};
			for (var [key, value] of mapdata) {
				myCall[key] = Buffer.alloc(String(value).length, String(value), 'utf8');
			}
			const entries = Object.entries(myCall);
			console.log("Outgoing Data => " + entries);
			var bx = new senderbox.BoxSender(myCall);
			console.log('sending AMP box');
			bx.writeToTransport(function(myCall) {client.connection.write(myCall.toString('utf8')); });
		};
		
        // Tells the client to start the connection to the server		
		this.start = function(){
		    this.connection = net.createConnection(this.clientport, this.clientaddress, function () {
				this.br = new receiverbox.ReceiverBox(checklist);   //(client.received);
			});
							
			// This event is called when the client connects with the server
			this.connection.on('connect', function(data) {
				console.log("Connect to the server");
				//Calls the connected callback function
				client.connected();
			});
			
			// This event is called when data is received from the network
			this.connection.on('data', function(data) {
				this.br.dataReceived(data);
			});
			
			// This event is called when the connection with the server has ended
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
		    //if(len1 < 32){
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
	// take a map of the below form and transform it to a new map as shown below
	//['command','Add'], ['var1',10], ['var2',20] => ['_ask',ask], ['_command','Add'], ['a', aVar], ['b', bVar]
	resultmap = new Map();
	var ask1 = String(ask.get_ask());
	resultmap.set('_ask', ask1);
	for (var [key, value] of map1) {
		if(key.toLowerCase() == "command"){
		    resultmap.set('_command', value);	
		}
		else{
		    if(typeof(value) == 'object'){
                // do array to string
				value = fromArray(value);
            }
            else{
                value = String(value);
            }	
			resultmap.set(key, value);
		}
        //console.log(key + ' = ' + value);
    }
	return resultmap;
}

module.exports = {
  server: server,
  callback: callback,
  errorObj: errorObj,
  client: client,
 // factory: factory,
};

		