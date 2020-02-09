const {setHeaders, setAgent, request} = require("../lib/request");
const cookies = require("../lib/cookies");
const enforceTypes = require("../util/type-enforcer");
const validateProxy = require("../util/proxy-validator");

module.exports = async (param, proxy) => {
    /**/
    enforceTypes(
        [param, "object"], [proxy, "string"]
    ); validateProxy(proxy);
    /**/
    let page, req;
    if (param.constructor.name === "Request"){
        req = param;
    }
    else if (param.constructor.name === "Page") {
        page = param;
        await page.setRequestInterception(true);
    } else {
        throw new Error("@arg1: Not valid 'Page' or 'Request' object");
    }
    const $puppeteerPageProxyHandler = async req => {
        if (req._interceptionHandled || !req._allowInterception) {
            return;
        }
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
    if (req) {
        $puppeteerPageProxyHandler(req);
    } else {
        for (const listener of page.listeners("request")) {
            if (listener.name === "$puppeteerPageProxyHandler") {
                page.removeListener("request", listener);
            }
        }; page.on("request", $puppeteerPageProxyHandler);
    }
}