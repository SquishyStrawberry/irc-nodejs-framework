var irc = require("../lib/main.js"),
    fs = require("fs");

var host = "irc.editingarchive.com",
    port = 6667;

fs.readFile("./host.json", function(err, data) {
    
    if (err) throw err;
    var info = JSON.parse(data.toString());
    var bot = new irc.IRCBot(info.host, info.port,
                             info.nick, info.channel);

    bot.on("join", function(e) {
        this.sendMessage("Hey" + 
                         (e.nick === this.nick ? "" : " " + e.nick) + "!");
    });

    bot.on("message", function(msg) {
        console.info("<" + msg.nick + ">", msg.text);
    });

    bot.on("commandTerminate", function() {
        bot.quit("Goodbye");
    });
});

