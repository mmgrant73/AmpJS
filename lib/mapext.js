/*
Extend the functionality of the Map Object
Need several of these function for this library so I decided
to extend the map class for possible future usage.
*/

class MapExt extends Map{
	/*
	constructor(mapdata = undefined) {
		let map1 = dateStr
		if(mapdata == undefined){
			super();
		}
		else{
            super(mapdata);
		}
    }
	*/
	/*
	  Reverse the Map order 
	  {["key1", "value1"], ["key2","value2]} => {["key2","value2"], ["key1","value1"]} 
	*/
	static reverseMap(map1){
	    return new Map([...map1].reverse());	
	}
	
	// invert key, value => value, key of a map object
	static invertMap(map1){
		let map2 = new Map();
        for (let [key, value] of map1) {
            let v = map1.get(key);
            map2.set(v, key);
        }
		return map2
	}
	
	// check if a map is empoty
	static isEmpty(map1){
	    if(map1.size == 0){
		    return false;
		}
		return true;
	}
	
	// Compare two maps size and if the same then return true else return false
	static compareMapSize(map1, map2) {	
		if (map1.size !== map2.size) {
			return false;
		}
		return true;
	}
	
	/*
	  Compare two maps if their size, keys and value are the same 
      then return true else return false	
     */
    static compareMaps(map1, map2) {		
		var testVal;
		if(!MapExt.compareMapSize(map1, map2)){
		    return false;	
		}
		for (var [key, val] of map1) {
			testVal = map2.get(key);
			/*
			in cases of an undefined value, make sure the key
			actually exists on the object so there are no false positives
			*/
			if (testVal !== val || (testVal === undefined && !map2.has(key))) {
				return false;
			}
		}
		return true;
    }
	
	/*
	  Compare two maps if their size and keys are the same 
      then return true else return false	
     */
	static compareMapsKeys(map1, map2) {		
		if(!MapExt.compareMapSize(map1, map2)){
		    return false;	
		}
		for (var [key, val] of map1) {
			if (!map2.has(key)) {
				return false;
			}
		}
		return true;
    }
	
	// Merge two maps together into one map
	static mergeMaps(map1, map2) {
	    return new Map([...map1, ...map2]);
	}
}

module.exports = {
  MapExt: MapExt
};