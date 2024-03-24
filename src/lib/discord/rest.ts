import { libClass, libFetch, libJSON, libLog } from "../lib";
import { RESTGetAPIGatewayResult } from "./types";

export class RESTMan extends libClass {
    constructor(log: libLog) {
        super("REST", log);
    }

    public DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

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
        return await (await this.discordFetch({
            method: 'GET',
            route: "/gateway"
        })).json() as RESTGetAPIGatewayResult;
    }
}