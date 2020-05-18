const {setHeaders, setAgent, request} = require("../lib/request");
const cookies = require("../lib/cookies");

const pageProxy = async (param, proxy) => {
    let page, req;
    if (param.constructor.name === "Request") {
        req = param;
    } else if (param.constructor.name === "Page") {
        page = param;
        await page.setRequestInterception(true);
    }
	// Responsible for forward requesting using proxy
    const $puppeteerPageProxyHandler = async req => {
		endpoint = req._client._connection._url;
		targetId = req._frame._id;
        const cookieJar = cookies.store(
			await cookies.get(endpoint, targetId)
		);
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
	// Remove existing listener for reassigning proxy of current page
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