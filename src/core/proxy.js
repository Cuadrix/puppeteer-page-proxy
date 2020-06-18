const request = require("got");
const type = require("../lib/types");
const cookieJar = require("../lib/cookies");
const {setOverrides, setHeaders, setAgent} = require("../lib/options");

// Responsible for applying proxy
const proxyHandler = async (req, proxy) => {
    const options = {
        cookieJar,
        method: req.method(),
        body: req.postData(),
        headers: setHeaders(req),
        agent: setAgent(proxy),
        responseType: "buffer",
        maxRedirects: 15,
        throwHttpErrors: false
    };
    try {
        const res = await request(req.url(), options);
        await req.respond({
            status: res.statusCode,
            headers: res.headers,
            body: res.body
        });
    } catch(error) {await req.abort()}
};

// For reassigning proxy of page
const removeRequestListener = (page, listenerName) => {
    const eventName = "request";
    const listeners = page.eventsMap.get(eventName);
    if (listeners) {
        const i = listeners.findIndex((listener) => {
            return listener.name === listenerName
        });
        listeners.splice(i, 1);
        if (!listeners.length) {
            page.eventsMap.delete(eventName);
        }
    }
};

// Calls this if request object passed
const proxyPerRequest = async (req, data) => {
    let proxy, overrides;
    // Separate proxy and overrides
    if (type(data) === "object") {
        if (Object.keys(data).length !== 0) {
            proxy = data.proxy;
            delete data.proxy;
            overrides = data;
        }
    } else {proxy = data}
    req = setOverrides(req, overrides);
    // Skip request if proxy omitted
    if (proxy) {await proxyHandler(req, proxy)}
    else {req.continue(overrides)}
};

// Calls this if page object passed
const proxyPerPage = async (page, proxy) => {
    await page.setRequestInterception(true);
    removeRequestListener(page, "$ppp");
    if (proxy) {
        page.on("request", $ppp = async (req) => {
            await proxyHandler(req, proxy);
        });
    } else {await page.setRequestInterception(false)}
};

// Main function
const useProxy = async (target, data) => {
    const targetType = target.constructor.name;
    if (targetType === "HTTPRequest") {
        await proxyPerRequest(target, data);
    } else if (targetType === "Page") {
        await proxyPerPage(target, data)
    }
};

module.exports = useProxy;