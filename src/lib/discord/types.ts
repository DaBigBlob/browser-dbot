export type RESTGetAPIGatewayResult = {
    url: string
};

export type APIUser = {
    id: string,
    username: string,
    discriminator: string,
    // other stuff that i dont care about (feel free to extend)
}

export type APIPartialApplication = {
    id: string,
    flags?: number
}

export type APIUnavailableGuild = {
    id: string,
    unavailable: true
}
export type APIGuild = {
    id: string,
    name: string,
    owner_id: string,
    afk_channel_id: string,
    afk_timeout: number,
    widget_enabled?: boolean,
    widget_channel_id?: string,
    verification_level: number, 
    default_message_notifications: number, 
    explicit_content_filter: number, 
    approximate_member_count?: number
    // other stuff that i dont care about (feel free to extend)
}

export type GatewayReadyEventD = {
    v: number
    user: APIUser
    guilds: Array<APIUnavailableGuild|APIGuild>
    session_id: string
    resume_gateway_url: string
    shard: Array<number>
    application: APIPartialApplication
}

export enum GatewayOP {
    Dispatch = 0,
    Heartbeat = 1,
    Identify = 2,
    PresenceUpdate = 3,
    VoiceStateUpdate = 4,
    Resume = 6,
    Reconnect = 7,
    RequestGuildMembers = 8,
    InvalidSession = 9,
    Hello = 10,
    HeartbeatAck = 11
}

export type GWReceivePayload =
    GWNonDispatch |
    GWDispatch;

export type GWNonDispatch =
    GWHello |
    GWHeartAck |
    GWHeartReq |
    GWInvalidSession |
    GWReconnect;

export type GWHello = {
    op: GatewayOP.Hello,
    d: {
      heartbeat_interval: number
    }
}
export type GWHeartAck = {
    op: GatewayOP.HeartbeatAck
}
export type GWHeartReq = {
    op: GatewayOP.Heartbeat
}
export type GWInvalidSession = {
    op: GatewayOP.InvalidSession,
    d: boolean
}
export type GWReconnect = {
    op: GatewayOP.Reconnect
}

export type GWDispatch =
    GWReadyDispatch |
    GenericGWDispatch;

export type GWReadyDispatch = {
    op: GatewayOP.Dispatch,
    d: GatewayReadyEventD,
    t: 'READY',
    s: number
}
export type GWGuildCreateDispatch = {
    op: GatewayOP.Dispatch,
    d: APIGuild,
    t: 'GUILD_CREATE',
    s: number
}
type GenericGWDispatch = {
    op: GatewayOP.Dispatch,
    d?: object|string|number|null,
    t: string,
    s: number
}