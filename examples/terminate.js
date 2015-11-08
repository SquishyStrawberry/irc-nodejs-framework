var irc = require("../lib/main.js"),
    fs = require("fs");

var host = "irc.editingarchive.com",
    port = 6667;

fs.readFile("./host.json", function(err, data) {
    if (err) throw err;

    var info = JSON.parse(data.toString());
    var bot = new irc.IRCBot(info.host, info.port,
                             info.nick, info.channel);

    process.on("SIGINT", function() {
        bot.quit("Goodbye");
    });

    bot.on("join", function(e) {
        console.info("[" + e.nick, 
                     "joined channel", 
                     e.args[0].substr(1).trim() + "]");
        this.sendMessage("Hey" + 
                         (e.nick === this.nick ? "" : " " + e.nick) + "!");
    });

    bot.on("part", function(e) {
        console.info("[" + e.nick, 
                     "left channel", 
                     (e.args[0] || bot.channel) + "]");
        if (e.nick !== this.nick) {
            this.sendMessage("Bye " + e.nick + "!");
        }
    });

    bot.on("message", function(msg) {
        console.info("<" + msg.nick + ">", msg.text);
    });

    bot.on("commandTerminate", function() {
        bot.quit("Goodbye");
    });
});

