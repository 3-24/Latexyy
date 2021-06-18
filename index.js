const dotenv = require('dotenv');
const math = require('./math.js');
dotenv.config();

console.log(process.env.TOKEN);

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
    if (command == 'tex'){
        tex_input = args.join(' ');
        console.log(tex_input);
        math(tex_input, 10.0).then(outputFileName => {
            console.log(outputFileName);
            message.channel.send({files: [outputFileName]});
        }).catch(error => message.channel.send(error));
    }
})

client.login(process.env.TOKEN);