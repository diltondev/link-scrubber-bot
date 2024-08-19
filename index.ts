import { REST } from "@discordjs/rest"
import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { Routes } from 'discord-api-types/v9'
import { Command } from "./types"
import dotenv from 'dotenv'

import fs from 'fs'
import path from 'path'

dotenv.config()

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

let commandTmp: Command[] = []
let commands: Command[] = []



const token: string =
    (process.env.NODE_ENV === 'development'
        ? process.env.TOKEN_DEV
        : process.env.TOKEN_PROD)!

client.once('ready', () => {
    console.log('Bot Ready!')

    let commandsFiles = fs.readdirSync(path.join(__dirname, './commands'))

    commandsFiles.forEach(async (file, i) => {
        commandTmp[i] = await import ('./commands/' + file)
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
    rest.put(Routes.applicationCommands(client.application!.id), {
        body: commands,
    })
        .then(() => {
            console.log('Commands registered!')
        })
        .catch(console.error)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
    const { commandName } = interaction
    const selectedCommand = commands.find(c => commandName === c.name)
    selectedCommand?.init(interaction, client)
})

client.login(token)
