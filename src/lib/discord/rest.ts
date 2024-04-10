import { isOnline, libClass, libFetch, libJSON, libLog } from "../lib";
import { RESTGetAPIGatewayResult } from 'discord-api-types/v10';

export class RESTMan extends libClass {
    constructor(log: libLog) {
        super("REST", log);
    }

    public DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

    public async onerror(kind: 'offline'): Promise<any> {kind;} // set externally

    public discordAuthHeader(token: string) {
        return {
            'Authorization': `Bot ${token}`
        };
    }
    public async discordFetch(
        fetch_data: {
            method: 'GET'|'POST'|'PATCH'|'PUT'|'DELETE',
            route: string,
            json_body?: object|null,
            extra_headers?: object
        }
    ) {
        if (!isOnline()) {
            this.logn("System offline")
            await this.onerror('offline');
            return null;
        }
        return await libFetch(`${this.DISCORD_API_ENDPOINT}${fetch_data.route}`, {
            body: libJSON.stringify(fetch_data.json_body),
            method: fetch_data.method,
            headers: {
            'Content-Type': `application/json`,
            ...fetch_data.extra_headers
            }
        });
    }
    public async getGatewayWSURL() {
        const r = await this.discordFetch({
            method: 'GET',
            route: "/gateway"
        });
        if (!r) return null;
        return await r.json() as RESTGetAPIGatewayResult;
    }
}