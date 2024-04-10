import { GatewayOpcodes, GatewayReceivePayload } from "discord-api-types/v10";
import { delay, libClass, libJSON } from "../../lib";
import { Terminal } from "../../terminal";
import { RESTMan } from "../rest";
import { HeartbeatMan } from "./heartbeat";
import { SessionMan } from "./session";
import { WebSocketMan } from "./ws";

export class GatewayMan extends libClass {
    private token: string;
    private wsm: WebSocketMan;
    private hbm: HeartbeatMan;
    private ssn: SessionMan;
    private rst: RESTMan;
    constructor(term: Terminal, token: string) {
        super("GATEWAY", (m: string) => {term.add(m);});
        this.token = token;
        this.wsm = new WebSocketMan(this.log);
        this.hbm = new HeartbeatMan(this.log, this.wsm);
        this.ssn = new SessionMan(this.log);
        this.rst = new RESTMan(this.log);
    }

    private async identify() {
        await this.wsm.send({
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
        }, true);
    }

    private async reconnect() {
        const rd = await this.ssn.data();
        if (!rd) return await this.rebegin();
        await this.wsm.set(`${rd.resume_gateway_url}/?v=10&encoding=json`);
        if (!await this.wsm.send({
            op: GatewayOpcodes.Reconnect,
            d: {
                token: this.token,
				seq: this.hbm.getSeq(),
				session_id: rd.session_id
            }
        })) return await this.rebegin();

    }

    public async rebegin() {
        await this.end();
        await this.begin();
    }
    public async begin() {
        const GWurl = await this.rst.getGatewayWSURL()
        if (!GWurl) {
            this.logn("Retrying after 5 seconds");
            await delay(5000);
            await this.rebegin();
            return;
        }
        await this.wsm.set(`${GWurl.url}/?v=10&encoding=json`);

        this.wsm.onmessage<string> = async (ev) => {
            const res = libJSON.parse(ev.data) as GatewayReceivePayload;
            switch(res.op) {
                case(GatewayOpcodes.Hello): {
                    this.logn("Hello from Discord");
                    await this.hbm.start(res.d.heartbeat_interval);
                    await this.identify();
                    break;
                }
                case(GatewayOpcodes.HeartbeatAck): {
                    this.logn("Heart ACK received");
                    await this.hbm.ack();
                    break;
                }
                case(GatewayOpcodes.Heartbeat): {
                    this.logn("Hearbeat reqest received");
                    await this.hbm.beat();
                    break;
                }
                case(GatewayOpcodes.InvalidSession): {
                    this.logn("Current session invalidated by Discord");
                    if (res.d) {
                        return await this.reconnect();
                    } else {
                        return await this.rebegin();
                    };
                }
                case(GatewayOpcodes.Reconnect): {
                    this.logn("Reconnection requested by Discord");
                    return await this.reconnect();
                }
                case(GatewayOpcodes.Dispatch): {
                    this.logn("Dispatch event reveived");
                    await this.hbm.seq(res.s);
                    switch(res.t) {
                        case('READY'): {
                            await this.ssn.populate(res.d);
                            const d = await this.ssn.data();
                            this.logn(`Logged in as ${d!.user.username}#${d!.user.discriminator} (${d!.user.id})`);
                            break;
                        }
                        case('GUILD_CREATE'): {
                            await this.ssn.guildCreate(res.d);
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
                return await this.reconnect();
            } else {
                return await this.rebegin();
            }
        }
    }

    public async end() {
        await this.wsm.close();
        await this.hbm.stop();
        await this.ssn.dispose();
    }
}