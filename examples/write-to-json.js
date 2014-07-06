/**
 * =======================================================
 * How to use node-osm-stream to read an .osm file stream
 * and write it to a file as a valid JSON
 * ======================================================
 *
 * In this example, we will parse through the .osm file and selectively filter
 * out certain nodes that we are not interested in.
 *
 * The rest of the data are then written out to a file as JSON objects in an array.
 *
 * After which, we will ensure that its a valid JSON file.
 *
 */

var fs = require('fs');
var OSMStream = require('./../');
var JSONStream = require('JSONStream');
var EOL = require('os').EOL;

// list of node ids that we want to skip when writing our data to file
var skipNodes = [1840700822, 1889319397];

var source      = __dirname + '/data/sample.osm';
var destination = __dirname + '/data/sample.json';

// open .osm file as a Readable file stream
var readstream  = fs.createReadStream(source);

// initialize our .osm stream parser
var parser      = OSMStream(); // or new OSMStream()

// open a Writeable file stream to write our JSON file
var writestream = fs.createWriteStream(destination);

// a JSON parser that we will use later to ensure that we have our valid JSON file
var jsonParser;

// attach our pipelines
readstream
  .pipe(parser)
  .pipe(writestream);

readstream.on('open', function () {
  console.log('Opened .osm file:', source, '\n');
});

var firstLine = true;
parser.on('writeable', function (data, callback) {
  if (firstLine) {
    firstLine = false;
    // add an opening square bracket before the first JSON object
    // that we are about to write to file
    callback('[' + EOL + '  ' + JSON.stringify(data));
  } else {
    // prepend a comma to the rest of the JSON objects
    callback(',' + EOL + '  ' + JSON.stringify(data));
  }
});
parser.on('flush', function (callback) {
  // add closing square bracket after all data has been written to file
  callback(EOL + ']' + EOL);
});

parser.on('node', function (node, callback) {
  // check current node id against list of nodes we want to skip
  if (skipNodes.indexOf(node.id) > -1) {
    // send back null or false to skip object
    callback();
  } else {
    callback(node);
  }
});
parser.on('way', function (way, callback) {

  // remove node ids that we do not want from current way object
  // note that we are directly modifying the given way object and passing it back
  for (var i in skipNodes){
    var skipNode = skipNodes[i];
    if (way.nodes.indexOf(skipNode) > -1){
      way.nodes.splice(way.nodes.indexOf(skipNode), 1);
    }
  }

  // passing back the modified object
  callback(way);
});
parser.on('relation', function (relation, callback) {

  // remove node ids that we do not want from current relation object
  var newMembers = [];
  for (var member in relation.members) {
    var ref = member.ref;
    if (skipNodes.indexOf(ref) < 0) {
      newMembers.push(member);
    }
  }

  // update current relation with the filtered list of relation.members
  relation.members = newMembers;

  // passing back the modified object
  callback(relation);
});

parser.on('end', function () {
  console.log('Finished parsing our .osm file');
  console.log('Bytes read from incoming stream:', parser.bytesRead, 'bytes');
  console.log('Bytes written to outgoing stream:', parser.bytesWritten, 'bytes\n');

  console.log('Checking that written file is a valid JSON:', destination);

  jsonParser  = JSONStream.parse(['rows', true]);
  fs.createReadStream(destination).pipe(jsonParser);

  var isValidJSON = true;
  jsonParser.on('error', function(err){
    // if we receive error, json is invalid
    console.log('JSON error', err);
    isValidJSON = false;
  });
  jsonParser.on('close', function(){
    console.log('JSON file check:', (isValidJSON)?'OK' : 'ERROR');
    console.log();
  });

});