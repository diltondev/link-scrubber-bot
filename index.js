const { REST } = require('@discordjs/rest')
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Routes } = require('discord-api-types/v9')
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });

const fs = require('fs')
const path = require('path');
const exp = require('constants');

let commandTmp = []
let commands = []

require('dotenv').config({
    path: path.join(__dirname, '.env'),
})

const token =
    process.env.NODE_ENV === 'development'
        ? process.env.TOKEN_DEV
        : process.env.TOKEN_PROD

client.once('ready', () => {
    console.log('Bot Ready!')

    let commandsFiles = fs.readdirSync(path.join(__dirname, './commands'))

    commandsFiles.forEach((file, i) => {
        commandTmp[i] = require('./commands/' + file)
        commands = [
            ...commands,
            {
                name: file.split('.')[0],
                description: commandTmp[i].description,
                init: commandTmp[i].init,
                options: commandTmp[i].options,
            },
        ]
    })

    const rest = new REST({ version: '9' }).setToken(token)
    rest.put(Routes.applicationCommands(client.application.id), {
        body: commands,
    })
        .then(() => {
            console.log('Commands registered!')
        })
        .catch(console.error)
})

client.on('interactionCreate', async interaction => {
    console.log(interaction)
    if (!interaction.isCommand()) return
    const { commandName } = interaction
    const selectedCommand = commands.find(c => commandName === c.name)
    selectedCommand.init(interaction, client)
})

client.on("messageCreate", async message => {
    let urls = []
    let matches = message.content.match(/(?:http|https):\/\/(?:(?:[\w_-]+\.)*tiktok\.com)(?:[\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/g)
    console.log(message)
    if (matches != null && message.author.id != process.env.USER_ID) {
        Promise.all(
            matches.map(async link => {
                let expandedURL = await fetch(link)
                    .then(response => response.text())
                    .then(page => {
                        let redirectURLs = page.match(/(?<="canonical":").+?(?=")/g)
                        if (redirectURLs == null) {
                            return link
                        } else {
                            // TikTok stores the redirect URLs with characters unicode escaped, so we need to replace the unicode chars with their normalized ones
                            // return redirectURLs[0].replaceAll(/\\u\w{4}/g, match => {JSON.parse(`"${match}"`)})
                            return JSON.parse(`"${redirectURLs[0]}"`)
                        }
                    })
                expandedURL = expandedURL.split("?")[0]
                urls.push(expandedURL)
            })
        )
            .then(() => {
                message.reply(`Here's your expanded URLs: ${urls.map(url => {return `\n<${url}>` })}`)
            })
    }
})

client.login(token)
