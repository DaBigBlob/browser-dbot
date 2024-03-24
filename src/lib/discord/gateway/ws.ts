import { delay, isOnline, libClass, libLog, libWebSocket } from "../../lib";
import { GatewayOP } from "../types";

export class WebSocketMan extends libClass {
    constructor(log: libLog) {
        super("WS", log);
    }

    private ws: libWebSocket | null = null;
    private async ws_new(url: string): Promise<boolean> {
        if (!isOnline()) {
            this.logn("System offline")
            return false;
        }
        try {
            this.ws = new libWebSocket(url);
            this.logn("New WS object created");
            return true;
        } catch {
            this.logn("Something went wrong creating new WS object")
            return false;
        }
    }
    private async ws_send(msg: string): Promise<boolean> {
        if (!isOnline()) {
            this.logn("System offline")
            return false;
        }
        if (!this.ws) {
            this.logn("WS points to null");
            return false
        }
        if (this.ws.readyState !== this.ws.OPEN) {
            this.logn("WS is not open");
            return false;
        }
        try {
            this.ws.send(msg);
            this.logn(`Message sent`);
            return true;
        } catch {
            this.logn(`Something went wrong sending message: ${msg}`)
            return false;
        }
    }
    private async ws_close(code?: number) {
        if (!isOnline()) {
            this.logn("System offline")
            return false;
        }
        if (!this.ws) {
            this.logn("WS points to null");
            return false
        }
        if (
            this.ws.readyState === this.ws.CLOSED ||
            this.ws.readyState === this.ws.CLOSING
        ) {
            this.logn("WS has CLOSED or CLOSING");
            return true;
        }
        try {
            this.ws.close(code);
            return true;
        } catch {
            return false;
        }
    }


    public async onclose(ev: CloseEvent): Promise<any> {ev;}        // set externally
    public async onerror(ev: Event): Promise<any> {ev;}             // set externally
    public async onmessage<T>(ev: MessageEvent<T>): Promise<any> {ev;}    // set externally
    
    public async set(url: string, retry: boolean = false): Promise<void> {
        this.logn(`Setting WS URL to ${url}`);
        if (!(await this.ws_new(url)) || !this.ws) {
            if (retry) {
                this.logn("Retrying after 5 seconds...");
                await delay(5000);
                await this.set(url);
                return;
            }
            return;
        }
        this.ws.onopen = () => this.logn("WS connection established");
        this.ws.onclose = async (ev) => await this.onclose(ev);
        this.ws.onerror = async (ev) => await this.onerror(ev);
        this.ws.onmessage = async (ev) => await this.onmessage(ev);
    }
    public async send(s: {
        op: GatewayOP,
        d?: object|number|string|null,
        s?: number|null,
        t?: string|null
    }, retry: boolean = false): Promise<boolean> {
        this.logn("Sending WS payload");
        const r = await this.ws_send(JSON.stringify(s));
        if (!r) {
            if (retry) {
                this.logn("Retrying after 5 seconds...");
                await delay(5000);
                return await this.send(s, retry);
            }
        }
        return r;
    }
    public async close(code?: number): Promise<boolean> {
        return await this.ws_close(code);
    }
}