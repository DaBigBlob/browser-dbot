// making it easier to polyfill
export const libMath = window.Math;
export class libWebSocket extends window.WebSocket {};
export type libLog = (msg: string) => void;
export class libClass {
    // @ts-ignore
    protected log: libLog
    constructor(name: string, log: libLog) {
        this.log = (msg: string) => log(`[${name}] ${msg}`);
        this.logn(`Initializing...`);
    }
    protected logn(msg: string) {
        this.log(msg+"\n");
    }
}
export const libSetInterval = window.setInterval;
export const libSetTimeOut = window.setTimeout;
export const libClearInterval = window.clearInterval;
export const libDate = window.Date;
export const libJSON = window.JSON;
export const libQuerySelector = document.querySelector;
export const libAlert = window.alert;
export const libLocalStorage = window.localStorage;
export function isOnline() {
    return navigator.onLine;
}
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));