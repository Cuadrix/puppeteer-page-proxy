const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const SocksProxyAgent = require("socks-proxy-agent");

// For overriding request objects
const setOverrides = (req, overrides) => {
    const map = {
        url: true,
        method: true,
        postData: true,
        headers: true
    };
    for (const key in overrides) {
        if (map[key]) {
            if (key === "headers") {
                req["$" + key] = () => overrides[key];
            } else {
                req[key] = () => overrides[key];
            }
        }
    }
    return req;
};

// Some extra headers
const setHeaders = (req) => {
    // If headers have been overriden
    if (req.$headers)
        return req.$headers();
    // Extended default headers
    const headers = {
        ...req.headers(),
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "host": new URL(req.url()).hostname
    }
    if (req.isNavigationRequest()) {
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

module.exports = {setOverrides, setHeaders, setAgent};