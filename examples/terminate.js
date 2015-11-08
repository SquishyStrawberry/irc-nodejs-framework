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
        console.log("JOIN", e.args);
        var chan = e.args[0].substr(1).trim();
        console.info("[" + e.nick, 
                     "joined channel", 
                     chan + "]");
        this.sendMessage("Hey" + 
                         (e.nick === this.nick ? "" : " " + e.nick) + "!", chan);
    });

    bot.on("PART", function(e) {
        var chan = e.args[0].trim();
        console.info("[" + e.nick, 
                     "left channel", 
                     chan + "]");
        if (e.nick !== this.nick) {
            this.sendMessage("Bye " + e.nick + "!", chan);
        }
    });

    bot.on("message", function(msg) {
        console.info("<" + msg.nick, "to", msg.recipient + ">", msg.text);
    });

    bot.on("commandTerminate", function() {
        bot.quit("Goodbye");
    });
});

