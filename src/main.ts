import { GatewayMan } from "./lib/discord/gateway/gateway";
import { Terminal, screen_init } from "./lib/terminal";
import { getToken } from "./lib/token";

(async () => {
    const screen = screen_init();
    if (!screen) return;

    const token = getToken();
    if (!token) return;

    const term = new Terminal(screen);

    const gate = new GatewayMan(term, token);

    await gate.begin();
})();