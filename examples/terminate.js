var irc = require("../lib/main.js"),
    fs = require("fs");

var host = "irc.editingarchive.com",
    port = 6667;

fs.readFile("host.json", function(data) {
    
    var info = JSON.parse(data);
    var bot = new irc.IRCBot(info.host, info.port,
                             info.nick, info.channel);

    bot.on("join", function(e) {
        this.sendMessage("Hey " + (e.nick === this.nick ? "" : e.nick) + "!");
    });

    bot.on("commandTerminate", function(commandInfo) {
        bot.quit("Goodbye");
    });
});

