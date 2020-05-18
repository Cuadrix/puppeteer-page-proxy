const got = require("got");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const SocksProxyAgent = require("socks-proxy-agent");

const request = {
    setHeaders(req) {
        const headers = {
            ...req.headers(),
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-encoding": "gzip, deflate, br",
            "host": new URL(req.url()).hostname
        };
        if (req.isNavigationRequest()) {
            headers["sec-fetch-mode"] = "navigate";
            headers["sec-fetch-site"] = "none";
            headers["sec-fetch-user"] = "?1";
        } else {
            headers["sec-fetch-mode"] = "no-cors";
            headers["sec-fetch-site"] = "same-origin";
        }
        return headers;
    },
    setAgent(url, proxy) {
        if (proxy.startsWith("socks")) {
            return {
                http: new SocksProxyAgent(proxy),
                https: new SocksProxyAgent(proxy)
            }
        } else {
            return {
                http: new HttpProxyAgent(proxy),
                https: new HttpsProxyAgent(proxy)
            }
        }
    },
    async request(url, options) {
        try {
            const res = await got(url, options);
            return {
                status: res.statusCode,
                headers: res.headers,
                body: res.body
            };
        } catch(error) {
            throw new Error(error);
        }
    }
};
module.exports = request;