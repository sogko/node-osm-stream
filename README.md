# node-osm-stream

## Overview
A NodeJS-based streamable parser for OpenStreetMap (.osm) files.

Both incoming and outgoing streams available for piping from/to other streams.

*Powered by  [node-expat](https://github.com/node-xmpp/node-expat) for blazing fast parsing.*

### Table of Content
* [Quick Start](#quick-start)
  * [Install](#install)
  * [Basic example](#example-reading-from-a-local-osm-file)
  * [More examples](#more-examples)
* [API](#api)
  * [Class: OSMStream](#class-osmstream)
  * [Methods](#methods)
  * [Events](#events)
    * [Events: 'node', 'way', 'relation'](#events-node-way-relation)
    * [Event:'writeable'](#event-writeable)
    * [Event:'flush'](#event-flush)
    * [Events inherited from stream.Transform](#events-inherited-from-streamtransform)
* [Test](#test)
* [Known Issues](#known-issues)
* [Credits](#credits)
* [Links](#links)
* [License](#license)

----

## Quick Start
### Install
````
npm install node-osm-stream
````
No fuss, no lints

### Example: Reading from a local .osm file
````
var fs = require('fs');
var OSMStream = require('node-osm-stream');
var parser = OSMStream();

// open a local .osm filestream
fs.createReadStream('./path/to/file.osm')
	.pipe(parser);

parser.on('node', function(node, callback){
	// Modify current node object as you wish
	// and pass it back to the callback.
	// Or pass 'null' or 'false' to prevent the object being 
	// written to outgoing stream
	console.log(node);
	callback(node);
});

parser.on('way', function(way, callback){ callback(way); });

parser.on('relation', function(way, callback){ callback(relation); });
````

Easy-peasy, lemon-squeezy.


### More examples
More advanced examples are available in the ```./examples``` folder

#### Writing to a JSON file using Writeable steam (fs.createWriteStream)
Source: [/examples/write-to-json.js](https://github.com/sogko/node-osm-stream/raw/master/examples/write-to-json.js)

To run example:
````
node ./examples/write-to-json.js
````

## API

### Class: OSMStream 
Class inherited from [stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform)

### Methods
All methods are inherited from [stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform)

### Events
#### Events: 'node', 'way', 'relation'
When an object (node/way/relation) from the .osm file has been parsed fully with its attributes and children (if any) ready, it will emit a 'node' or 'way' or 'relation' event, depending on the object type.

You can modify the outgoing data and passing it back to the callback.
Or you can prevent the data from being passed downstream by passing back a *null* or *false*

It's important to note that since this is a streaming parser, any other objects (ways/relations) that may have referenced a skipped node may still hold its reference. It is up to the implementation to remove its references. 

To see an example of a possible implementation, take a look at ```` /examples/write-to-json.js````

Note: If this event was registered, the callback must be passed back.

````
parser.on('node', function(node, callback) {
  // modify the node object as necessary and pass back to callback
  // or send a null or false to prevent it from going downstream
  callback(node);
});

parser.on('way', function(way, callback) {
  ...
  callback(way);
});
parser.on('relation', function(relation, callback) {
  ...
  callback(relation);
});
````

#### Event: 'writable'
When a chunk of data is ready to be written to the outgoing stream, it will emit a 'writeable' event.

You can modify the outgoing data and passing it back to the callback.
Or you can prevent the data from being passed downstream by passing back a *null* or *false*

Note: If this event was registered, the callback must be passed back.

````
parser.on('writeable', function(data, callback) {
  // there is some data to be passed to outgoing stream
  // modify 'data' as needed
  callback(data);
});
````

#### Event: 'flush'
After all the written data has been consumed through the outgoing stream, it will emit a 'flush' event.
This will happened before the 'end' event is sent to signal the end of the readable side.

You can choose to pass in as much data as needed by passing it through the callback.
Any data passed back will be written to the outgoing stream before the 'end' event is emitted.

Note: If this event was registered, the callback must be passed back.

````
parser.on('flush', function(callback) {
  var last_data = 'This is the last string sent to the outgoing stream';
  callback(last_data);
});
````

#### Events inherited from stream.Transform
In addition to the events above, the following are events inherited from stream.Transform class.
Please refer to the offical documentation for more info: [NodeJS API Documentation: stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform)

* Event: 'readable'
* Event: 'data'
* Event: 'end'
* Event: 'close'
* Event: 'error'
* Event: 'drain'
* Event: 'finish'
* Event: 'pipe'
* Event: 'unpipe'


## Test
````
npm test
`````

## Known Issues



## Credits

* [Hafiz Ismail](https://github.com/sogko) 
* [node-expat](https://github.com/node-xmpp/node-expat)

## Links
* [twitter.com/sogko](https://twitter.com/sogko)
* [github.com/sogko](https://github.com/sogko)
* [medium.com/@sogko](https://medium.com/@sogko)

## License
Copyright (c) 2014 Hafiz Ismail. This software is licensed under the [MIT License](https://github.com/sogko/node-osm-stream/raw/master/LICENSE).
