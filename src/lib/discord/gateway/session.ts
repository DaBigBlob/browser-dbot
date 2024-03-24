import { libClass, libLog } from "../../lib";
import { APIGuild, GatewayReadyEventD } from "../types";

export class SessionMan extends libClass {
    constructor(log: libLog) {
        super("SESSION", log);
    }
    private session: GatewayReadyEventD|null = null;

    public onerror(kind: 'access_to_no_guild'|'access_to_no_reconnect_data'|'guild_mismatch'): any {kind;} // set externally

    public dispose() {
        this.logn("Disposing session data");
        this.session = null;
    }
    public populate(data: GatewayReadyEventD) {
        if (!!this.session) this.dispose();
        this.logn("Populating session data");
        this.session = data;
    }
    public guildCreate(guilds: APIGuild) {
        if (!this.session) {
            this.onerror('access_to_no_guild');
            return;
        }
        const idx = this.session!.guilds.findIndex(g => (g.id === guilds.id));
        if (idx !== -1) {
            this.session!.guilds[idx] = guilds;
            this.logn("Guild info added successfully");
        } else {
            this.logn(`Could not find guild with ID ${guilds.id} to replace`);
            this.onerror('guild_mismatch');
        }
    }
    public reconnectData(): {
        resume_gateway_url: string,
        session_id: string
    }|null {
        if (!this.session) {
            this.onerror('access_to_no_reconnect_data');
            return null;
        }
        return {
            resume_gateway_url: this.session.resume_gateway_url,
            session_id: this.session.session_id
        };
    }
}