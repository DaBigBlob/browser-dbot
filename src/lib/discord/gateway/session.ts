import { libClass, libLog } from "../../lib";
import { APIGuild, GatewayReadyEventD } from "../types";

export class SessionMan extends libClass {
    constructor(log: libLog) {
        super("SESSION", log);
    }
    private session: GatewayReadyEventD|null = null;

    public async onerror(kind: 'access_to_no_guild'|'access_to_no_data'|'guild_mismatch'): Promise<any> {kind;} // set externally

    public async dispose() {
        this.logn("Disposing session data");
        this.session = null;
    }
    public async populate(data: GatewayReadyEventD) {
        if (!!this.session) await this.dispose();
        this.logn("Populating session data");
        this.session = data;
    }
    public async guildCreate(guilds: APIGuild) {
        if (!this.session) {
            await this.onerror('access_to_no_guild');
            return;
        }
        const idx = this.session!.guilds.findIndex(g => (g.id === guilds.id));
        if (idx !== -1) {
            this.session!.guilds[idx] = guilds;
            this.logn("Guild info added successfully");
        } else {
            this.logn(`Could not find guild with ID ${guilds.id} to replace`);
            await this.onerror('guild_mismatch');
        }
    }
    public async data(): Promise<GatewayReadyEventD | null> {
        if (!this.session) {
            await this.onerror('access_to_no_data');
            return null;
        }
        return this.session;
    }
}