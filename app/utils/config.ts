import fs from 'node:fs'

export const config = {
    host: '127.0.0.1:8002',
    maxChannel: 64,
    maxAux: 32,
    consoleType: 'sd',
}

let loadConfigPromise_;
if (import.meta.client) {
    loadConfigPromise_ = fetch('/config/config.json')
    .then(res => res.json())
    .then(res => {
        config.host = res.host;
        config.maxChannel = res.maxChannel;
        config.maxAux = res.maxAux;
        config.consoleType = res.consoleType;
    });
} else {
    let data = JSON.parse(fs.readFileSync('public/config/config.json', 'utf-8'));
    config.host = data.host;
    config.maxChannel = data.maxChannel;
    config.maxAux = data.maxAux;
    config.consoleType = data.consoleType;
    loadConfigPromise_ = new Promise((resolve, _) => resolve(config));
}
export const loadConfigPromise = loadConfigPromise_;
