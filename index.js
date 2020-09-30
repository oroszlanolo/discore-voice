const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const token = '';

let cache;
let current = [];
let lastJoinedChannels = [];

function saveCache() {
    let dataStr = JSON.stringify(cache);
    fs.writeFileSync('cache.json', dataStr);
}

function loadCache() {
    let rawdata = fs.readFileSync('cache.json');
    cache = JSON.parse(rawdata);
}

client.once('ready', () => {
    console.log('Ready!');
    loadCache();
    if (cache.channel) {
        client.channels.fetch(cache.channel.id)
            .then(ch => cache.channel = ch)
            .catch(console.error);
    }
});

client.on('message', message => {
    if (message.content === '-bb setup') {
        cache.channel = message.channel;
        let VCID = lastJoinedChannels[message.author.id];
        if (!VCID) {
            message.channel.send("You need to join a voice channel to set up notification.");
            return;
        }
        cache.voiceChannel = VCID;
        cache.setup = true;
        saveCache();
    }
    if (message.content === '-bb disable') {
        cache.setup = false;
        saveCache();
    }
    saveCache();
    if (message.content === '!ping') {
        // send back "Pong." to the channel the message was sent in
        message.channel.send('Pong.');
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    let usr = await client.users.fetch(oldState.id);
    if (newState.channelID) {
        lastJoinedChannels[usr.id] = newState.channelID;
    }
    if (!cache.setup) {
        return;
    }

    if (oldState.channelID && oldState.channelID == cache.voiceChannel) {
        if (!current[oldState.channelID]) {
            current[oldState.channelID] = 1;
        }
        current[oldState.channelID]--;

        let chn = await client.channels.fetch(oldState.channelID);
        if (cache.channel) {
            cache.channel.send(`<@${usr.id}>  has left the ` + chn.name + " channel.");
            // cache.channel.send("Emberek száma: " + current[oldState.channelID]);
        }
    }

    if (newState.channelID && newState.channelID == cache.voiceChannel) {
        let chn = await client.channels.fetch(newState.channelID);
        if (!current[newState.channelID]) {
            current[newState.channelID] = 0;
            cache.channel.send(`@everyone, <@${usr.id}> is the first to join the ` + chn.name + " channel.");
        }

        current[newState.channelID]++;
        if (cache.channel) {
            cache.channel.send(`<@${usr.id}>  has joined the ` + chn.name + " channel.");
            // cache.channel.send("Emberek száma: " + current[newState.channelID]);
        }
    }
});

client.login(token);