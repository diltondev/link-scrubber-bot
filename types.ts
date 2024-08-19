export interface Command {
    name: string,
    description: string,
    init: Function,
    options: string
}