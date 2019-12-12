var ampjs = require('../lib/ampjs-min');


class doadd{
	constructor(){
		this.clientconn = ampjs.client;
		this.clientconn.clientaddress = '127.0.0.1';
		this.clientconn.clientport = 1234;
		this.clientconn.connected = this.connected;
		this.clientconn.received = this.received;
	}
	connected(){
		console.log('A connection has been established');
		var data = new Map([['command','Add'], ['a', '1'], ['b', '2']]);
		ampjs.client.remoteCall(data);
	}
	received(data){
		console.log('Data has been received back from the server');
		const entries = Object.entries(data);
		const keys = Object.keys(data);
		if(keys[0] == "_answer"){
			if(data['total'] == NaN){
				ampjs.errorObj.set_code("151");
				ampjs.errorObj.set_description("The response data is not right");
			}
			else{
				ResolveCommand(data['total']);
			}
		}
		else{
			RejectCommand(data);
		}
	}
}

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
			ampjs.errorObj.reset_error();
        }).
	    finally(function (){
			// This block has no effect on the return value.
			console.log('All done!')
		}); 
		
