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
    parseMessage: function parseMessage(msg) {
        return msg;
    },
    stripColor: function stripColor(str) {
        return str;
    }
};

