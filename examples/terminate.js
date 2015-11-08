var irc = require("../lib/main.js"),
    fs = require("fs");

var host = "irc.editingarchive.com",
    port = 6667;

fs.readFile("./host.json", function(err, data) {
    if (err) throw err;

    var info = JSON.parse(data.toString());
    var bot = new irc.IRCBot(info.host, info.port,
                             info.nick, info.channels);

    process.on("SIGINT", function() {
        bot.quit("Goodbye");
    });

    // TODO Use the dedicated join/part events.
    bot.on("JOIN", function(e) {
        var chan = e.args[0].substr(1).trim();
        console.info("[" + e.sender.nick, 
                     "joined channel", 
                     chan + "]");
        this.sendMessage("Hey" + 
                         (e.sender.nick === this.nick ? "" : " " + e.sender.nick) + "!", chan);
    });

    bot.on("PART", function(e) {
        var chan = e.args[0].trim();
        console.info("[" + e.sender.nick, 
                     "left channel", 
                     chan + "]");
        if (e.sender.nick !== this.nick) {
            this.sendMessage("Bye " + e.sender.nick + "!", chan);
        }
    });

    bot.on("message", function(msg) {
        console.info("<" + msg.sender.nick, "to", msg.recipient + ">", msg.text);
    });

    bot.on("commandTerminate", function() {
        bot.quit("Goodbye");
    });
});

