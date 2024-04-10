import { APIGuild, GatewayReadyDispatchData } from "discord-api-types/v10";
import { libClass, libLog } from "../../lib";

export class SessionMan extends libClass {
    constructor(log: libLog) {
        super("SESSION", log);
    }
    private session: GatewayReadyDispatchData|null = null;

    public async onerror(kind: 'access_to_no_guild'|'access_to_no_data'|'guild_mismatch'): Promise<any> {kind;} // set externally

    public async dispose() {
        this.logn("Disposing session data");
        this.session = null;
    }
    public async populate(data: GatewayReadyDispatchData) {
        if (!!this.session) await this.dispose();
        this.logn("Populating session data");
        this.session = data;
    }
    public async guildCreate(guild: APIGuild) {
        if (!this.session) {
            await this.onerror('access_to_no_guild');
            return;
        }
        const idx = this.session!.guilds.findIndex(g => (g.id === guild.id));
        if (idx !== -1) {
            const _guild = {...guild, unavailable: false} as APIGuild & { unavailable: boolean };
            this.session!.guilds[idx] = _guild;
            this.logn("Guild info added successfully");
        } else {
            this.logn(`Could not find guild with ID ${guild.id} to replace`);
            await this.onerror('guild_mismatch');
        }
    }
    public async data(): Promise<GatewayReadyDispatchData | null> {
        if (!this.session) {
            await this.onerror('access_to_no_data');
            return null;
        }
        return this.session;
    }
}