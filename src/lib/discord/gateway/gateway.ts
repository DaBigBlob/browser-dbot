import { libClass, libJSON } from "../../lib";
import { Terminal } from "../../terminal";
import { getGatewayWSURL } from "../rest";
import { GatewayOP, GWGuildCreateDispatch, GWReadyDispatch, GWReceivePayload } from "../types";
import { HeartbeatMan } from "./heartbeat";
import { SessionMan } from "./session";
import { WebSocketMan } from "./ws";

export class GatewayMan extends libClass {
    private token: string;
    private wsm: WebSocketMan;
    private hbm: HeartbeatMan;
    private ssn: SessionMan;
    constructor(term: Terminal, token: string) {
        super("GATEWAY", (m: string) => {term.add(m);});
        this.token = token;
        this.wsm = new WebSocketMan(this.log);
        this.hbm = new HeartbeatMan(this.log, this.wsm);
        this.ssn = new SessionMan(this.log);
    }

    private identify() {
        this.wsm.send({
            op: GatewayOP.Identify,
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
        }, true);
    }

    private async reconnect() {
        const rd = this.ssn.reconnectData();
        if (!rd) {
            await this.rebegin();
            return;
        }
        await this.wsm.set(`${rd.resume_gateway_url}/?v=10&encoding=json`);
        if (!this.wsm.send({
            op: GatewayOP.Reconnect,
            d: {
                token: this.token,
				seq: this.hbm.getSeq(),
				session_id: rd.session_id
            }
        })) await this.rebegin();

    }

    public async rebegin() {
        this.end();
        await this.begin();
    }
    public async begin() {
        await this.wsm.set(`${(await getGatewayWSURL()).url}/?v=10&encoding=json`);

        this.wsm.onmessage<string> = async (ev) => {
            const res = libJSON.parse(ev.data) as GWReceivePayload;
            switch(res.op) {
                case(GatewayOP.Hello): {
                    this.logn("Hello from Discord");
                    this.hbm.start(res.d.heartbeat_interval);
                    this.identify();
                    break;
                }
                case(GatewayOP.HeartbeatAck): {
                    this.logn("Heart ACK received");
                    this.hbm.ack();
                    break;
                }
                case(GatewayOP.Heartbeat): {
                    this.logn("Hearbeat reqest received");
                    this.hbm.beat();
                    break;
                }
                case(GatewayOP.InvalidSession): {
                    this.logn("Current session invalidated by Discord");
                    if (res.d) {
                        await this.reconnect();
                    } else {
                        return await this.begin();
                    };
                    break;
                }
                case(GatewayOP.Reconnect): {
                    this.logn("Reconnection requested by Discord");
                        await this.reconnect();
                    break;
                }
                case(GatewayOP.Dispatch): {
                    this.logn("Dispatch event reveived");
                    this.hbm.seq(res.s);
                    switch(res.t) {
                        case('READY'): {
                            this.ssn.populate((res as GWReadyDispatch).d);
                            break;
                        }
                        case('GUILD_CREATE'): {
                            this.ssn.guildCreate((res as GWGuildCreateDispatch).d);
                            break;
                        }
                        default: this.logn(`Unhandled event of type ${res.t}`);
                    }
                    break;
                }
            }
        }
        this.wsm.onclose = async (ev) => {
            if (ev.code < 4010 && ev.code != 4004) {
                await this.reconnect();
            } else {
                return await this.begin();
            }
        }
    }

    public end() {
        this.wsm.close();
        this.hbm.stop();
        this.ssn.dispose();
    }
}