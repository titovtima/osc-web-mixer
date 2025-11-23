export async function getConfig() {
    if (import.meta.server)
        return {
            host: import.meta.env.BACKEND_HOST,
            maxChannel: Number(import.meta.env.MAX_CHANNEL),
            maxAux: Number(import.meta.env.MAX_AUX),
            consoleType: import.meta.env.CONSOLE_TYPE,
        }
    else
        return await fetch('/config.json').then(res => res.json())
}
