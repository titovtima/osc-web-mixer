import { getConfig } from '../../app/utils/config.ts'

export default defineEventHandler(async (event) => {
    setResponseHeader(event, 'Content-Type', 'application/json');
    console.log('is server', import.meta.server);
    return await getConfig();
    // return {
    //     host: import.meta.env.BACKEND_HOST,
    //     maxChannel: import.meta.env.MAX_CHANNEL,
    //     maxAux: import.meta.env.MAX_AUX,
    //     consoleType: import.meta.env.CONSOLE_TYPE,
    // };
});
