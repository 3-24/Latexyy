const dotenv = require('dotenv');
const latexConvert = require('./latexConvert.js');
dotenv.config();

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Latexxy is ON');
});

client.on('message', message => {
    const prefix = '!'
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args =  message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift();
    if (command == 'inline' || command == 'display'){
        const tex_input = `${(command == 'display') ? "\\displaystyle" : ""} ${args.join(' ')}`;
        latexConvert(tex_input, 10.0).then(outputFileName => {
            message.channel.send({files: [outputFileName]});
        }).catch(error => message.channel.send(error.toString()));
    }
})

client.login(process.env.TOKEN);