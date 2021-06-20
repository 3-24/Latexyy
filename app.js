const latexConvert = require('./latexConvert.js');
const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
    client.user.setActivity("tex.help", {type: "LISTENING"})
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
    } else if (command == "help"){
        message.channel.send(new Discord.MessageEmbed()
        .setColor('#1f2247')
        .setDescription('')
        .setTitle('Available Commands')
        .setAuthor('Latexxy', 'https://imgur.com/9XszfCX.png')
        .setDescription(`
        **tex.inline <input>**: Return rendered image of LaTeX inline equation.
        **tex.display <input>**: Return rendered image of LaTeX isplay equation
        **tex.help**: Show this message`)
        .addField(`Bug Report & Contribution`,
        `You may raise an issue on the Github repository,
        https://github.com/3-24/Latexxy.`, true)
        .setTimestamp()
        .setFooter('Help Message', 'https://imgur.com/9XszfCX.png'))
    }
})

client.login(config.bot_token);