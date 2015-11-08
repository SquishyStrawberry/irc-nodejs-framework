var ircutil = require("./ircutil.js"),
    net = require("net"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

function IRCBot(host, port, nick) {
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
}

util.inherits(IRCBot, EventEmitter);

IRCBot.prototype.send = function irc_send(data) {
    // No `self` needed?
    if (data.substr(data.length - 2) != "\r\n") {
        data += "\r\n";
    }
    this.socket.write(data, "utf8");
};

IRCBot.prototype.connect = function irc_connect() {
    var self = this;
    self.socket.once("data", function socket_data_event(data) {
        if (self.handlePing(data)); // Don't do anything if it's a PING
        else switch (true) {
            case self.step === 0 && ircutil.shouldIdentify(data):
                self.send("USER HelloUser 8 * :HelloReal");
                self.send("NICK " + self.nick);
                self.step = 1;
                break;
            case self.step === 1 && ircutil.shouldJoinChannel(data, self.nick):
                // Send JOIN, etc...
                self.send("JOIN #bottest");
                self.step = 2;
                break;
        }
        if (self.step < 2) {
            self.socket.once("data", socket_data_event);
        }
        else {
            // TODO Add message handling past this point
            self.socket.on("data", self.handleMessage.bind(self));
        }
    });
};

IRCBot.prototype.handlePing = function handlePing(msg) {
    if (ircutil.shouldSendPing(msg)) {
        this.send(msg.replace("PING", "PONG"));
        return true;
    }
    return false;
};

IRCBot.prototype.handleMessage = function handleMessage(msg) {
    var self = this;
    if (self.handlePing(msg)) return;
    var parsed = ircutil.parsePrivmsg(msg);
    if (parsed === null) return;
    console.info("<" + parsed.nick + ">", parsed.text);
};

module.exports = IRCBot;
