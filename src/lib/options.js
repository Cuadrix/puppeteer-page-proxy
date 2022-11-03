const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");

// Set some extra headers because Puppeteer doesn't capture all request headers
// Related: https://github.com/puppeteer/puppeteer/issues/5364
const setHeaders = (request) => {
    const headers = {
        ...request.headers(),
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "host": new URL(request.url()).host
    }
    if (request.isNavigationRequest()) {
        headers["sec-fetch-mode"] = "navigate";
        headers["sec-fetch-site"] = "none";
        headers["sec-fetch-user"] = "?1";
    } else {
        headers["sec-fetch-mode"] = "no-cors";
        headers["sec-fetch-site"] = "same-origin";
    }
    return headers;
};

// For applying proxy
const setAgent = (proxy) => {
    if (proxy.startsWith("socks")) {
        return {
            http: new SocksProxyAgent(proxy),
            https: new SocksProxyAgent(proxy)
        };
    }
    return {
        http: new HttpProxyAgent(proxy),
        https: new HttpsProxyAgent(proxy)
    };
};

module.exports = {setHeaders, setAgent};
