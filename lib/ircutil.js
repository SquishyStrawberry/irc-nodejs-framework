module.exports = {
    shouldIdentify: function shouldIdentify(msg) {
        return msg.indexOf("your hostname") !== -1;
    },
    shouldJoinChannel: function shouldJoinChannel(msg, nick) {
        return msg.indexOf(":" + nick + " MODE") !== -1;
    },
    shouldSendPing: function shouldSendPing(msg) {
        return msg.indexOf("PING :") === 0;
    },
    pythonSplit: function pythonSplit(str, sep, limit) {
        var substrs = [str];
        while (limit-- > 0) {
            var lastString = substrs.pop();
            var sepIndex = lastString.indexOf(sep);
            if (sepIndex === -1) break;
            substrs.push(lastString.substring(0, sepIndex));
            substrs.push(lastString.substring(sepIndex + sep.length));
        }
        return substrs;
    },
    parseMessage: function parseMessage(msg, noSplitArgs) {
        if (msg[0] !== ":") return null;
        msg = msg.substr(1);
        // [0] is the nickname of the sender, [1] is host & rest
        nick_host = this.pythonSplit(msg, "!", 1);
        // [0] is the user of the sender, [1] is the host & rest
        user_host = this.pythonSplit(nick_host[1], "@", 1);
        // [0] is the host of the sender, [1] is the command
        host_command = this.pythonSplit(user_host[1], " ", 1);
        // [0] is the command, [1] are the args
        command_args = this.pythonSplit(host_command[1], " ", 1);
        return {
            nick: nick_host[0],
            user: user_host[0],
            host: host_command[0],
            command: command_args[0],
            args: noSplitArgs ? command_args[1] : command_args[1].split(" ")
        };
    },
    _parsePrivmsg: function _parsePrivmsg(parsed) {
        // Assume input is valid cause this is "internal"
        // ... Even if it's able to be used from outside, it's on purpose.
        return {
            nick: parsed.nick,
            user: parsed.user,
            host: parsed.host,
            recipient: parsed.args[0],
            text: parsed.args[1].substr(1).replace("\r\n", "")
        };
    },
    parsePrivmsg: function parsePrivmsg(msg) {
        var parsed = this.parseMessage(msg);
        if (!parsed || parsed.command !== "PRIVMSG") return null;
        return this._parsePrivmsg(parsed);
    },
    stripColor: function stripColor(str) {
        return str;
    }
};

