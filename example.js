var irc = require("./lib/main.js");
var host = "irc.editingarchive.com",
    port = 6667;

var bot = new irc.IRCBot(host, port, 
                         "node_framework_test", "#bottest");

bot.on("join", function(e) {
    this.sendMessage("Hey " + (e.nick === this.nick ? "" : e.nick) + "!");
});

bot.on("commandTerminate", function(commandInfo) {
    bot.quit("Goodbye");
});

