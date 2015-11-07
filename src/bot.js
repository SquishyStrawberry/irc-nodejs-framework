var EventEmitter = require("events").EventEmitter,
    util = require("util"),
    irc_utils = require("./irc_utils.js");

function IRCBot() {
    EventEmitter.call(this);
}

util.inherits(IRCBot, EventEmitter);

// TODO Add some methods

module.exports = IRCBot;

