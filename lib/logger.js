/**
 * NodeJS logger with datetime stamp just because.
 * ===============================================
 *
 * Hold onto your socks now.
 *
 * Usage example
 *      var logger = new (require('./logger'))().log;
 *      var prefixedLogger = new (require('./logger'))('[PREFIX]').log;
 *
 *      var a = 'Hey girl.', b = { smooth: 'water' }
 *
 *      logger('Hello world.', a , b);
 *      prefixedLogger('Hello world.', a , b);
 *          -> [2014-07-05T17:59:24Z] Hello world. Hey girl. { smooth: 'water' }
 *          -> [2014-07-05T17:59:24Z] [PREFIX] Hello world. Hey girl. { smooth: 'water' }
 *
 *
 * References:
 * NodeJS implementation of console.log
 * - https://github.com/joyent/node/blob/master/lib/console.js#L52-L54
 *
 * For padded datetime stamp
 * - http://stackoverflow.com/a/12550320/245196
 *
 * Gisted by Hafiz Ismail / @sogko
 * Available @ https://gist.github.com/sogko/fcb7c1620850a362968c
 *
 */
var util = require('util');
var EOL = require('os').EOL;
var pad = function (n){ return n<10 ? ['0',n].join('') : n; };
function Logger(prefix){
  if (!(this instanceof Logger)) { return new Logger(prefix); }
  this.prefix = prefix || '';
  this.log = function (){
    if (arguments instanceof Object){ arguments = Array.prototype.slice.call(arguments, 0);}
    var d = new Date();
    d = ['[',d.getUTCFullYear(),'-',pad(d.getUTCMonth()+1),'-',pad(d.getUTCDate()),'T',pad(d.getUTCHours()),':',pad(d.getUTCMinutes()),':',pad(d.getUTCSeconds()),'Z] ', this.prefix, ' ' ].join('');
    process.stdout.write(d);
    arguments.forEach(function(o){process.stdout.write(util.format(o)+' ');});
    process.stdout.write(EOL);
  }.bind(this);
}
module.exports = Logger;