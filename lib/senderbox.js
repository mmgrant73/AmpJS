/*
 This file was originally written by Ying Li from his implementation of the AMP protocol 
 that can be found at https://github.com/cyli/node-amp
 
 I have made minor changes to his BoxSender class to bring the code up to date. For example,
 new buffer contruct is now deprecated due to security and usability issues.  Also, I dumped
 his receivebox class and wrote my own due to fatal flaws in his implementation that cause 
 the data to be corrupted at random times.  And moved it to its own file receiverbox.js so 
 that it is easier to debug.
*/

// Wire-encode an Amp Box (dictionary) as per the AMP protocol -
// dictionary should have buffers as values
// @return {string} as defined by the AMP protocol
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
  // Empty key signifying the end of the box
  pushBuffer(Buffer.alloc(0));   //(new Buffer([]));
}

// Write the buffers to a transport
// @param transportWrite {function} a callback that takes a buffer and takes
//      a buffer and does something with it (like write it to a socket)
BoxSender.prototype.writeToTransport = function (transportWrite) {
  var self = this;
  for (var i=0; i<self._wireBuffers.length; i++) {
    transportWrite(self._wireBuffers[i]);
  }
 };

module.exports = {
  BoxSender: BoxSender
};
