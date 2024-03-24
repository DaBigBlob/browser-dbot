import { GatewayOpcodes, GatewayReadyDispatchData, GatewayReceivePayload } from "discord-api-types/v10";
import { Terminal } from "../terminal";
import { getGatewayWSURL } from "./rest";
import { libClass } from "../lib";

function new_ws_payload(s: {
    op: number,
    d?: object|number|string|null,
    s?: number|null,
    t?: string|null
}) {
    return JSON.stringify(s);
}

export class DiscordGateway extends libClass {
    private token: string;

    constructor(terminal: Terminal, token: string) {
        super("OLD_GW", (msg: string) => {terminal.add(msg)});
        this.token = token;
    }

    private ws: WebSocket|null = null;
    private hb_interval: number|null = null;
    private hb_parity: boolean = true;
    private hb_cycle_hook: number|null = null;
    private jitter = 0.7;
    private seq: number|null = null;
    private ready_data: GatewayReadyDispatchData|null = null;

    private heartbeat() {
        if (!this.hb_parity) {
            this.begin();
            return;
        }
        if (this.ws) {
            this.ws.send(new_ws_payload({
                op: GatewayOpcodes.Heartbeat,
                d: this.seq
            }));
            this.hb_parity = false;
            this.logn(`HEARTBEAT with sequence: ${this.seq}`);
        }
    }
    private init_heartbeat_cycle(): number|null {
        this.hb_parity = true;
        if (this.hb_interval) return setInterval(() => {
            this.heartbeat();
        }, this.hb_interval*this.jitter);
        return null;
    }
    private self_identify() {
        if (this.ws) {
            this.ws.send(new_ws_payload({
                op: GatewayOpcodes.Identify,
                d: {
                    token: this.token,
                    properties: {
                        os: "NetBSD",
                        browser: "curl",
                        device: "toaster"
                    },
                    presence: {
                        status: 'idle',
                        activities: [{
                            name: `${navigator.userAgent}`,
                            type: 5,
                            created_at: Date.now()
                        }]
                    },
                    intents: 1
                }
            }));
            this.logn(`IDENTITY to Discord`);
        }
    }
    private reconnect() {
        if (this.is_offline(true)) return;

        this.logn(`Reconnecting to Discord`);
        if (this.hb_cycle_hook) clearInterval(this.hb_cycle_hook);

        if (this.ready_data) {
            try {
                this.logn( `WebSocket set to ${this.ready_data.resume_gateway_url}`);
                this.ws = new WebSocket(`${this.ready_data.resume_gateway_url}/?v=10&encoding=json`);
                this.logn( `Resuming Discord connection`);
                this.ws.send(new_ws_payload({
                    op: GatewayOpcodes.Resume,
                    d: {
                        token: this.token,
                        session_id: this.ready_data.session_id,
                        seq: this.seq
                    }
                }));
                this.init_heartbeat_cycle();
                this.logn( `RECONNECT CRED to Discord`);
            } catch {
                this.respawn();
                return;
            }
        }
        else this.begin();
    }

    private deal_with_received(pld: GatewayReceivePayload) {
        switch (pld.op) {
            case (GatewayOpcodes.Hello): {
                this.logn("HELLO from Discord");
                this.hb_interval = pld.d.heartbeat_interval;
                this.logn(`HEARTBEAT interval to ${this.hb_interval}`);
                this.hb_cycle_hook = this.init_heartbeat_cycle();
                this.self_identify();
                break;
            }
            case (GatewayOpcodes.HeartbeatAck): {
                this.logn("HEARTBEAT ACK from Discord");
                this.hb_parity = true;
                break;
            }
            case (GatewayOpcodes.Heartbeat): {
                this.logn( "HEARTBEAT request from Discord");
                this.hb_parity = true;
                this.heartbeat();
                break;
            }
            case (GatewayOpcodes.Dispatch): {
                if (pld.s) {
                    this.seq = pld.s;
                    this.logn(`SEQUENCE to ${this.seq}`);
                }

                switch (pld.t) {
                    case ("READY"): {
                        this.logn("READY from Discord");
                        this.ready_data = pld.d;
                        this.logn(`READY DATA`);
                        this.logn(`Logged in as ${this.ready_data.user.username}#${this.ready_data.user.discriminator} (${this.ready_data.user.id})`);
                        break;
                    }
                    default: this.logn(`Dispatch type ${pld.t}`);
                }
                break;
            }
            case (GatewayOpcodes.Reconnect): {
                this.logn("RECONNECT from Discord");
                this.reconnect();
                break;
            }
            case (GatewayOpcodes.InvalidSession): {
                this.logn("INVALID SESSION from Discord");
                if (pld.d) this.reconnect();
                else this.begin();
                break;
            }
        }
    }

    private deal_with_closed(code: number) {
        if (code < 4010 && code != 4004) {
            this.reconnect();
        } else {
            this.begin();
        }
    }

    private is_offline(restart: boolean) {
        this.logn("Checking Internet connection");
        if (!navigator.onLine) {
            this.logn( "No internet connection");
            if (restart) this.respawn();
            return true;
        }
        return false;
    }

    private respawn() {
        if (this.hb_cycle_hook) clearInterval(this.hb_cycle_hook);
        this.logn("Retrying after 5 seconds");
        setTimeout(() => this.begin(), 5000);
    }

    public async begin() {
        if (this.is_offline(true)) return;

        try {
            const wss_url = (await getGatewayWSURL()).url;
            this.logn(`WebSocket set to ${wss_url}`);

            this.ws = new WebSocket(`${wss_url}/?v=10&encoding=json`);
        } catch {
            this.respawn();
            return;
        }

        this.ws.onmessage = async (evn: MessageEvent<string>) => {
            const res = JSON.parse(evn.data) as GatewayReceivePayload;
            // this.logn("debug res", JSON.stringify(res, null, 4));
            this.deal_with_received(res);
        }

        this.ws.onclose = async (evn) => {
            this.deal_with_closed(evn.code);
        }
    }

    public close() {
        if (this.is_offline(false)) return;
        if (this.ws) this.ws.close(1001);
    }
}