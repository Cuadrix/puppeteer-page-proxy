const {setHeaders, setAgent, request} = require("../lib/request");
const cookies = require("../lib/cookies");
const enforceTypes = require("type-dragoon");

const pageProxy = async (param, proxy) => {
    /**/
    enforceTypes({object: param});
    /**/
    let page, req;
    if (param.constructor.name === "Request") {
        req = param;
    } else if (param.constructor.name === "Page") {
        page = param;
        await page.setRequestInterception(true);
    } else {
        throw new Error("Not valid `Page` or `Request` object");
    }
    const $puppeteerPageProxyHandler = async req => {
        const cookieJar = cookies.store(await cookies.get(
            req._client._connection._url, req._frame._id
        ));
        const options = {
            cookieJar,
            method: req.method(),
            responseType: "buffer",
            headers: setHeaders(req),
            body: req.postData(),
            followRedirect: false,
            throwHttpErrors: false
        };
        try {
            options.agent = setAgent(req.url(), proxy);
            const res = await request(req.url(), options);
            await req.respond(res);
        } catch(error) {
            await req.abort();
        }
    };
    const removeRequestListener = () => {
        const listeners = page.listeners("request");
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].name === "$puppeteerPageProxyHandler") {
                page.removeListener("request", listeners[i]);
            }
        }
    };
    if (req) {
        $puppeteerPageProxyHandler(req);
    } else {
        removeRequestListener();
        if (proxy) {
            page.on("request", $puppeteerPageProxyHandler);
        } else {
            await page.setRequestInterception(false);
        }
    }
};
module.exports = pageProxy;