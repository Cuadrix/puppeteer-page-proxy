class CDP {
    constructor(client) {
        // Network domain: https://chromedevtools.github.io/devtools-protocol/1-3/Network/
        this.Network = {
            async getCookies(urls) {
                return (await client.send("Network.getCookies", urls)).cookies;
            },
            async setCookies(cookies) {
                await client.send("Network.setCookies", cookies);
            },
            async deleteCookies(cookies) {
                await client.send("Network.deleteCookies", cookies);
            }
        }
    }
}

module.exports = CDP;