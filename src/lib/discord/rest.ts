import { RESTGetAPIGatewayResult } from "./types";

const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

export function discordAuthHeader(token: string) {
    return {
        'Authorization': `Bot ${token}`
    };
}

export async function discordFetch(
    fetch_data: {
        method: 'GET'|'POST'|'PATCH'|'PUT'|'DELETE',
        route: string,
        json_body?: object|null,
        extra_headers?: object
    }
) {
    return await window.fetch(`${DISCORD_API_ENDPOINT}${fetch_data.route}`, {
        body: JSON.stringify(fetch_data.json_body),
        method: fetch_data.method,
        headers: {
        'Content-Type': `application/json`,
        ...fetch_data.extra_headers
        }
    });
}

export async function getGatewayWSURL() {
    return await (await discordFetch({
        method: 'GET',
        route: "/gateway"
    })).json() as RESTGetAPIGatewayResult;
}