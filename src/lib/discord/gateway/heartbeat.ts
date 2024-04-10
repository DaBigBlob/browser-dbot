import { libClass, libClearInterval, libLog, libSetInterval } from "../../lib";
import { WebSocketMan } from "./ws";

export class HeartbeatMan extends libClass{
    private cycle_hook: number = 0;
    private s: number|null = null;
    private wsm: WebSocketMan;
    private acked: boolean = true;

    constructor(log: libLog, wsm: WebSocketMan) {
        super("HEART", log);
        this.wsm = wsm;
    }

    public async onerror(kind: 'ws_send'|'parity'): Promise<any> {kind;} // set externally

    public async ack() {
        this.logn("Last heartbeat ACKed");
        this.acked = true;
    }
    public async seq(seq: number) {
        this.logn(`Sequence set to ${seq}`);
        this.s = seq;
    }
    public async getSeq() {
        return this.s;
    }
    public async beat() {
        if (!this.acked) {
            this.logn("Previous heartbeat not acknowledged");
            await this.onerror('parity');
            return;
        }
        if (await this.wsm.send({
            op: 1,
            d: this.s
        })) {
            this.acked = false;
            this.logn(`Sent heartbeat with sequence ${this.s}`);
        } else {
            this.onerror('ws_send');
        }
    }
    public async start(interval: number) {
        if (this.cycle_hook != 0) this.stop();
        this.cycle_hook = libSetInterval(
            async () => await this.beat(),
            interval * 0.05//libMath.random() // TODO
        );
        this.logn(`Started with interval ${interval}`);
    }
    public async stop() {
        libClearInterval(this.cycle_hook);
        this.cycle_hook = 0;
        this.logn("Stopped");
    }
}