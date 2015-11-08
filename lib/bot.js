var ircutil = require("./ircutil.js"),
    net = require("net"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

String.prototype.capitalize = function string_capitalize() {
    return this[0].toUpperCase() + this[1].toLowerCase();
};

function IRCBot(host, port, nick, channel) {
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
    self.channel = channel;
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
    return this.send("PRIVMSG " + (recipient || this.channel) + " :" + msg);
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
                self.send("JOIN " + self.channel);
                self.step += 1;
                break;
        }
        if (self.step < 2) {
            self.socket.once("data", socket_data_event);
        }
        else {
            self.socket.on("data", self.handleMessage.bind(self));
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
        console.info("<" + privmsg.nick + ">", privmsg.text);
        self.emit("message", privmsg);
        if (parsed.args[1].substr(1).toUpperCase() === self.nick.toUpperCase()) {
            var commandInfo = {
                // This feels dumb. Any way to make this smarter?
                nick: privmsg.nick,
                user: privmsg.user,
                host: privmsg.host,
                recipient: privmsg.recipient,
                command: parsed.args[2].trim(),
                args: parsed.args.slice(2)
            };
            self.emit("command", commandInfo);
            self.emit("command" + commandInfo.command.capitalize(), commandInfo);
        }
    }
    // Even if you should normalize with toUpperCase, most IRC Commands usually
    // only use ASCII Chars.
    else if (parsed !== null) self.emit(parsed.command.toLowerCase(), parsed);
};

IRCBot.prototype.quit = function irc_quit(reason) {
    var cmd = "PART " + this.channel;
    if (reason) {
        cmd += " :" + reason;
    }
    this.socket.end(cmd + "\r\n", "utf8");
}; 

module.exports = IRCBot;

