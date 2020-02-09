module.exports = class CDP {
    static async Send(ws, command) {
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
    }
    static Target = {
        attachToTarget: async (ws, targetId) => {
            const result = (await this.Send(ws, {
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
    };
    static Network = {
        getCookies: async (ws, sessionId) => {
            const result = (await this.Send(ws, {
                sessionId,
                id: 2,
                method: "Network.getCookies"
            })).result;
            if (result) {
                return result.cookies;
            }
        }
    };
}