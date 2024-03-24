import { delay, isOnline, libClass, libLog, libWebSocket } from "../../lib";
import { GatewayOP } from "../types";

export class WebSocketMan extends libClass {
    constructor(log: libLog) {
        super("WS", log);
    }

    private ws: libWebSocket | null = null;
    private ws_new(url: string): boolean {
        if (!isOnline()) {
            this.logn("Offline...")
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
    private ws_send(msg: string): boolean {
        if (!isOnline() || !this.ws || this.ws.readyState !== this.ws.OPEN) {
            this.logn("Offline or internal error...")
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
    private ws_close(code?: number) {
        if (!isOnline() || !this.ws) {
            this.logn("Offline or internal error...")
            return false;
        }
        if (
            this.ws.readyState === this.ws.CLOSED ||
            this.ws.readyState === this.ws.CLOSING
        ) return true;
        try {
            this.ws.close(code);
            return true;
        } catch {
            return false;
        }
    }


    public onclose(ev: CloseEvent): any {ev;}        // set externally
    public onerror(ev: Event): any {ev;}             // set externally
    public onmessage<T>(ev: MessageEvent<T>): any {ev;}    // set externally
    
    public async set(url: string): Promise<void> {
        if (!this.ws_new(url) || !this.ws) {
            this.logn("Retrying after 5 seconds...");
            await delay(5000);
            return await this.set(url);
        }
        this.ws.onopen = () => this.logn("WS connection established");
        this.ws.onclose = (ev) => this.onclose(ev);
        this.ws.onerror = (ev) => this.onerror(ev);
        this.ws.onmessage = (ev) => this.onmessage(ev);
    }
    public send(s: {
        op: GatewayOP,
        d?: object|number|string|null,
        s?: number|null,
        t?: string|null
    }, retry: boolean = false): boolean {
        const r = this.ws_send(JSON.stringify(s));
        return (!r && retry) ? this.send(s, retry) : r;
    }
    public close(code?: number) {
        return this.ws_close(code);
    }
}