import { libClass, libClearInterval, libLog, libMath, libSetInterval } from "../../lib";
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

    public onerror(kind: 'ws_send'|'parity'): any {kind;} // set externally

    public ack() {
        this.logn("Last heartbeat ACKed");
        this.acked = true;
    }
    public seq(seq: number) {
        this.logn(`Sequence set to ${seq}`);
        this.s = seq;
    }
    public getSeq() {
        return this.s;
    }
    public beat() {
        if (!this.acked) {
            this.logn("Previous heartbeat not acknowledged");
            this.onerror('parity');
            return;
        }
        if (this.wsm.send({
            op: 1,
            d: this.s
        })) {
            this.acked = false;
            this.logn(`Sent heartbeat with sequence ${this.s}`);
        } else {
            this.onerror('ws_send');
        }
    }
    public start(interval: number) {
        if (this.cycle_hook != 0) this.stop();
        this.cycle_hook = libSetInterval(
            () => this.beat(),
            interval * libMath.random()
        );
        this.logn(`Started with interval ${interval}`);
    }
    public stop() {
        libClearInterval(this.cycle_hook);
        this.cycle_hook = 0;
        this.logn("Stopped");
    }
}