const request = require("got");
const {type} = require("../lib/types");
const {getCookies, cookieStore} = require("../lib/cookies");
const {setOverrides, setHeaders, setAgent} = require("../lib/options");

const useProxy = async (target, proxy) => {
    // Listener responsible for applying proxy
    const $puppeteerPageProxyHandler = async req => {       
        endpoint = req._client._connection._url;
        targetId = req._frame._id;
        const cookieJar = cookieStore(
            await getCookies(endpoint, targetId)
        );
        const options = {
            cookieJar,
            method: req.method(),
            body: req.postData(),
            headers: setHeaders(req),
            agent: setAgent(proxy),
            responseType: "buffer",
            throwHttpErrors: false
        };
        try {
            const res = await request(req.url(), options);
            await req.respond({
                status: res.statusCode,
                headers: res.headers,
                body: res.body
            });
        } catch(error) {
            await req.abort();
        }
    };
    // Remove existing listener for reassigning proxy of current page
    const removeRequestListener = (page, listenerName) => {
        const listeners = page.listeners("request");
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].name === listenerName) {
                page.removeListener("request", listeners[i]);
            }
        }
    };
    // Proxy per request
    if (target.constructor.name.indexOf("Request")!=-1) {
        if (type(proxy) == "object") {
            target = setOverrides(target, proxy);
            proxy = proxy.proxy;
        }
        await $puppeteerPageProxyHandler(target);
    // Page-wide proxy
    } else if (target.constructor.name === "Page") {
        if (type(proxy) == "object") {
            proxy = proxy.proxy;
        }
        await target.setRequestInterception(true);
        removeRequestListener(target, "$puppeteerPageProxyHandler");
        if (proxy) {
            target.on("request", $puppeteerPageProxyHandler);
        } else {
            await target.setRequestInterception(false);
        }
    }
};
module.exports = useProxy;
