var ircutil = require("./ircutil.js"),
    net = require("net"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

String.prototype.capitalize = function string_capitalize() {
    return this[0].toUpperCase() + this.substr(1).toLowerCase();
};

Array.prototype.contains = function array_contains(needle) {
    var contained = false;
    this.forEach(function(item) {
        if (item === needle) contained = true;
    });
    return contained;
};

function IRCBot(host, port, nick, channels) {
    var self = this;
    EventEmitter.call(self);
    self.socket = net.connect({
        host: host,
        port: port
    }, function() {
        self.socket.setEncoding("utf8");
        self.connect();
    });
    self.step = 0;
    self.nick = nick;
    self.joinedChannels = [];
    
    // This is only for the channels to join on connect
    if (typeof channels === "string") channels = [channels];
    self._channels = channels;
}

util.inherits(IRCBot, EventEmitter);

IRCBot.prototype.send = function irc_send(data) {
    // No `self` needed?
    if (data.substr(data.length - 2) != "\r\n") {
        data += "\r\n";
    }
    this.socket.write(data, "utf8");
};

IRCBot.prototype.sendMessage = function irc_sendMessage(msg, recipient) {
    this.emit("message", {
        // FIXME Add a host to this
        sender: new ircutil.User(this.nick, this.nick, ""),
        recipient: recipient,
        text: msg
    });
    return this.send("PRIVMSG " + recipient + " :" + msg);
};

IRCBot.prototype.joinChannel = function irc_joinChannel(chan) {
    if (!this.joinedChannels.contains(chan)) {
        this.send("JOIN :" + chan);
        this.joinedChannels.push(chan);
    }
};

IRCBot.prototype.partChannel = function irc_partChannel(chan, reason) {
    var newChannels = [],
        found = false;
    this.joinedChannels.forEach(function(item, index) {
        if (item !== chan) {
            newChannels.push(item);
        }
        else {
            found = true;    
        }
    });
    this.joinedChannels = newChannels;
    if (found) {
        var cmd = "PART " + chan;
        if (typeof reason === "string") {
            cmd += " :" + reason;
        }
        this.send(cmd);
    }
};

IRCBot.prototype.connect = function irc_connect() {
    var self = this;
    self.socket.once("data", function socket_data_event(data) {
        if (self.handlePing(data)); // Don't do anything if it's a PING
        else switch (true) {
            case self.step === 0 && ircutil.shouldIdentify(data):
                self.send("USER " + self.nick + " 8 * :" + self.nick);
                self.send("NICK " + self.nick);
                self.step += 1;
                break;
            case self.step === 1 && ircutil.shouldJoinChannel(data, self.nick):
                self._channels.forEach(function(item) {
                    self.joinChannel(item);
                });
                self.step += 1;
                break;
        }
        if (self.step < 2) {
            self.socket.once("data", socket_data_event);
        }
        else {
            self.socket.on("data", function(data) {
                data.split("\r\n").forEach(self.handleMessage.bind(self));
            });
        }
    });
};

IRCBot.prototype.handlePing = function irc_handlePing(msg) {
    if (ircutil.shouldSendPing(msg)) {
        this.send(msg.replace("PING", "PONG"));
        return true;
    }
    return false;
};

IRCBot.prototype.handleMessage = function irc_handleMessage(msg) {
    var self = this;
    if (self.handlePing(msg)) return;
    var parsed = ircutil.parseMessage(msg);
    var privmsg = ircutil.parseParsedPrivmsg(parsed);
    if (privmsg !== null) {
        self.emit("message", privmsg);
        if (parsed.args[1].substr(1).toUpperCase() === self.nick.toUpperCase()) {
            var commandInfo = {
                sender: privmsg.sender,
                recipient: privmsg.recipient,
                command: parsed.args[2].trim(),
                args: parsed.args.slice(2)
            };
            // You can also catch ALL commands.
            self.emit("command", commandInfo);
            self.emit("command" + commandInfo.command.capitalize(), commandInfo);
        }
    }
    // Is this a bad way to use switch like this? inline?
    else if (parsed !== null) switch(parsed.command.toUpperCase()) {
        case "JOIN":
        case "PART": // FIXME Add dedicated events
        default:
            // Just so you can catch any command
            self.emit(parsed.command.toUpperCase(), parsed);
    }
};

IRCBot.prototype.quit = function irc_quit(reason) {
    var self = this;
    self.joinedChannels.forEach(function(item) {
        self.partChannel(item, reason);
    });
    this.socket.end("QUIT\r\n", "utf8");
}; 

module.exports = IRCBot;

