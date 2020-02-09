const WebSocket = require("ws");
const {CookieJar} = require("tough-cookie");
const {Target, Network} = require("./cdp");

module.exports = class Cookies {
    static async get(endpoint, targetId) {
        const ws = new WebSocket(endpoint, {
            perMessageDeflate: false,
            maxPayload: 180 * 4096 // 0.73728Mb
        });
        await new Promise(resolve => ws.once("open", resolve));
        /* Attach to target then get cookies */
        const sessionId = await Target.attachToTarget(ws, targetId);
        return await Network.getCookies(ws, sessionId);
    };
    static store(cookies) {
        if (!cookies) {
            return;
        }
        return CookieJar.deserializeSync({
            version: 'tough-cookie@3.0.1',
            storeType: 'MemoryCookieStore',
            rejectPublicSuffixes: true,
            cookies: cookies.map((cookie) => {
                return {
                    key: cookie.name,
                    value: cookie.value,
                    expires: cookie.expires === -1 ? Infinity : new Date(cookie.expires * 1000).toISOString(),
                    domain: cookie.domain.replace(/^\./, ""),
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    creation: new Date().toISOString(),
                    hostOnly: !cookie.domain.match(/^\./)
                };
            })
        });
    };
};