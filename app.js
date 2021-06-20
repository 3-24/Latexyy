const latexConvert = require('./latexConvert.js');
const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Latexxy is ON');
});

client.on('message', message => {
    const prefix = 'tex.'
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args =  message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift();
    if (command == 'inline' || command == 'display'){
        const tex_input = `${(command == 'display') ? "\\displaystyle" : ""} ${args.join(' ')}`;
        latexConvert(tex_input, 10.0).then(outputFileName => {
            message.channel.send({files: [outputFileName]});
        }).catch(error => message.channel.send(error.toString()));
    } else if (command == "shutdown"){
        if (message.author.id == config.owner_id){
            message.channel.send('Shutting down...').then(m => {
                client.destroy();
                // TODO: destory the database client 
            });
        }
    }
})

client.login(config.bot_token);