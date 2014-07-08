var expat = require('node-expat');
var util = require('util');
var extend = util._extend;
var Transform = require('stream').Transform;

var logger = require('./logger')('[OSMStream]').log;
logger = function () {}; // comment out to show debug logs

function OSMStream(options) {
  if (!(this instanceof OSMStream)) return new OSMStream(options);

  Transform.call(this, options);

  var primaryElements = ['node', 'way', 'relation']; // emit-ables
  var subElementName = ['tag', 'nd', 'member'];

  // size of bytes read from source so far
  this.bytesRead = 0;
  // size of bytes written to stream so far
  this.bytesWritten = 0;

  // initialize parser and its event handlers
  this._parser = new expat.Parser();

  this._parser.on('pipe', (function onParserPipe(src) {
    logger('_parser received pipe from ', src.path || '<unknown pipe>');
  }).bind(this));

  this._parser.on('startElement', (function onParserStartElement(name, attrs) {
    var funcname = ['__parse_', name].join('');
    if ((primaryElements.indexOf(name) > -1 && (OSMStream.prototype[funcname])) ||
      (subElementName.indexOf(name) > -1 && this._currentElement !== null && (OSMStream.prototype[funcname]))) {
      OSMStream.prototype[funcname].call(this, attrs);
    }
  }).bind(this));

  this._parser.on('endElement', (function onParserEndElement(name) {
    if ((primaryElements.indexOf(name) < 0)) return;

    var clone = extend({}, this._currentElement);
    this._currentElement = null;

    var pushData = function pushData(data) {
      if (!data) return;

      if (this.listeners('writeable').length > 0) {
        this.emit('writeable', data, (function onWriteable(data) {
          this.__push(data);
        }).bind(this));
      } else {
        this.__push(data);
      }

    }.bind(this);

    if (this.listeners(name).length > 0) {
      this.emit(name, clone, (function onElement(data) {
        pushData(data);
      }.bind(this)));
    } else {
      pushData(clone);
    }
  }).bind(this));

  this._parser.on('error', (function onParserError(err) {
    this.emit('error', err);
  }).bind(this));

  this._parser.on('end', (function onParserEnd() {
  }).bind(this));

  this.on('pipe', (function onPipe(src) {
    if (src === this._parser) return;
    // attaching stream pipe to parser
    logger('Received pipe from ', src.toString(), ', attaching pipe to _parser');
    src.pipe(this._parser);
    this._parser.pipe(this);
  }).bind(this));

}

util.inherits(OSMStream, Transform);

OSMStream.prototype._transform = function (chunk, encoding, callback) {
  this.bytesRead += chunk.length;
  // Let data pass through here, transformation and
  // writing to stream will be done by this._parser.
  callback();
};

OSMStream.prototype._flush = function (callback) {
  if (this.listeners('flush').length > 0) {
    this.emit('flush', (function onFlush(data) {
      this.__push(data);
      callback();
    }).bind(this));
  } else {
    callback();
  }
};

OSMStream.prototype.__push = function (object) {
  // a wrapper to _push(), to ensure that data are Buffer-able strings
  // and keep count of bytes written

  if (!object) return;

  if (typeof object !== 'string' && !(object instanceof String)) {
    object = JSON.stringify(object);
  }

  var chunk = new Buffer(object);
  this.push(chunk);
  this.bytesWritten += chunk.length;

  // Note: how about the convention of .push(EOF) or .push(null) to stop fs.writeStream?
};

OSMStream.prototype.__parseCommonAttributes = function (attrs) {
  // Reference: http://wiki.openstreetmap.org/wiki/Data_Primitives#Common_attributes
  var obj = {};
  obj._key = parseInt(attrs.id);  // map it to _key so we can import edges
  obj.id = parseInt(attrs.id);
  obj.user = attrs.user;
  obj.uid = parseInt(attrs.uid);
  obj.timestamp = new Date(attrs.timestamp);
  obj.visible = (attrs.visible) ? (['', attrs.visible].join('').toLowerCase() !== 'false') : true; // default: true // TODO: unittest
  obj.version = parseInt(attrs.version);
  obj.changeset = parseInt(attrs.changeset);
  obj.tags = {};
  return obj;
};

// OSMStream.prototype.__parse_* are not free from side-effects
// They modify the object's internal state (this._currentElement)
OSMStream.prototype.__parse_node = function (attrs) {
  var obj = this.__parseCommonAttributes(attrs);
  obj.type = 'node';
  obj.lat = parseFloat(attrs.lat);
  obj.lon = parseFloat(attrs.lon);
  this._currentElement = obj;
};

OSMStream.prototype.__parse_way = function (attrs) {
  var obj = this.__parseCommonAttributes(attrs);
  obj.type = 'way';
  obj.nodes = [];
  this._currentElement = obj;
};

OSMStream.prototype.__parse_relation = function (attrs) {
  var obj = this.__parseCommonAttributes(attrs);
  obj.type = 'relation';
  obj.members = [];
  this._currentElement = obj;
};

OSMStream.prototype.__parse_tag = function (attrs) {
  if (!this._currentElement) return;
  if (!this._currentElement.tags) this._currentElement.tags = {};
  this._currentElement.tags[attrs.k] = attrs.v;
};

OSMStream.prototype.__parse_nd = function (attrs) {
  if (!this._currentElement) return;
  if (!this._currentElement.nodes) this._currentElement.nodes = [];
  this._currentElement.nodes.push(parseInt(attrs.ref));
};

OSMStream.prototype.__parse_member = function (attrs) {
  var member = {
    type: attrs.type,
    role: attrs.role || null,
    ref: parseInt(attrs.ref)
  };

  if (!this._currentElement) return;
  if (!this._currentElement.members) this._currentElement.members = [];
  this._currentElement.members.push(member);

};
module.exports = OSMStream;