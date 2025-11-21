export type channel = {
    number: number,
    name: string,
    order: number,
    hidden: boolean,
    color: string,
}

export type channelGroup = {
    name: string,
    order: number,
    hidden: boolean,
    channels: channel[],
}
