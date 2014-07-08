/**
 * ===========================================================
 * How to stream outgoing pipe from node-osm-stream to stdout
 * ==========================================================
 *
 * This example shows the basic principle of piping to both incoming and outgoing streams.
 *
 * We will
 * - pipe in data from a ReadStream and
 * - pipe out the data to process.stdout (console)
 *
 */

var fs = require('fs');
var OSMStream = require('./../');
var EOL = require('os').EOL;

var source      = __dirname + '/data/sample.osm';

// open .osm file as a Readable file stream
var readstream  = fs.createReadStream(source);

// initialize our .osm stream parser
var parser      = OSMStream(); // or new OSMStream()

// attach our pipelines
readstream
  .pipe(parser)
  .pipe(process.stdout);

readstream.on('open', function () {
  console.log('Opened .osm file:', source, '\n');
});

parser.on('writeable', function (data, callback) {
  // simply format the outgoing data that's going to be printed on our console as a string
  callback(['Type: ', data.type, EOL, 'Id: ', data.id, EOL, EOL].join(''));
});

parser.on('end', function () {
  console.log('Finished parsing our .osm file');
});