const cdp = {
    async _send(ws, command) {
        ws.send(JSON.stringify(command));
        return new Promise(resolve => {
            ws.on("message", function handler(msg) {
                const response = JSON.parse(msg);
                if (response.id === command.id) {
                    ws.removeListener("message", handler);
                    resolve(response);
                }
            });
        });
    },
    Target: {
        async attachToTarget(ws, targetId) {
            const result = (await cdp._send(ws, {
                id: 1,
                method: "Target.attachToTarget",
                params: {
                    targetId: targetId,
                    flatten: true,
                }
            })).result;
            if (result) {
                return result.sessionId;
            }
        }
    },
    Network: {
        async getCookies(ws, sessionId) {
            const result = (await cdp._send(ws, {
                sessionId,
                id: 2,
                method: "Network.getCookies"
            })).result;
            if (result) {
                return result.cookies;
            }
        }
    }
};
module.exports = cdp;