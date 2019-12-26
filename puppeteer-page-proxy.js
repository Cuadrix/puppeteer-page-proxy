const request = require("request");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const SocksProxyAgent = require("socks-proxy-agent");
const stream = require("stream");
const zlib = require("zlib");

class RequestUtil {
    static async simple(options, handler) {
        options.encoding = null;

        const headers = {};
        for (let key in options) {
            if (key == "headers") {
                Object.assign(headers, options.headers);
            }
            else if (key == "headerLines") {
                const parsedHeaders = this.linesToHeaders(options.headerLines);
                Object.assign(headers, parsedHeaders);
            }
        }
        options.headers = headers;

        if (options.proxy) {
            let proxy;
            const typeofProxy = typeof options.proxy;
            if (typeofProxy == "string") {
                proxy = options.proxy;
            }
            else if (typeofProxy == "object" && options.proxy.href) {
                proxy = options.proxy.href;
            }

            if (proxy) {
                options.headers["accept-encoding"] = "identity, gzip, deflate";

                const reqUrl = options["url"] || options["uri"];
                if (proxy.startsWith("socks")) {
                    options.agent = new SocksProxyAgent(options.proxy);
                }
                else if (reqUrl.startsWith("https")) {
                    options.agent = new HttpsProxyAgent(options.proxy);
                }
                else {
                    options.agent = new HttpProxyAgent(options.proxy);
                }
                delete options.proxy;
            }
        }

        try {
            const res = await new Promise((resolve, reject) => {
                request(options, (error, res) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    const simpleRes = {
                        status: res.statusCode,
                        headers: res.headers,
                        body: res["body"] || Buffer.from([])
                    };
                    if (simpleRes.body.length) {
                        let bodyPipe = new stream.PassThrough();
                        const contentEncodings = (res.headers["content-encoding"] || "").split(/, ?/).filter(item => item != "").reverse();
                        for (let contentEncoding of contentEncodings) {
                            switch (contentEncoding) {
                                case "gzip":
                                    bodyPipe = bodyPipe.pipe(zlib.createGunzip());
                                    break;
                                case "deflate":
                                    bodyPipe = bodyPipe.pipe(zlib.createInflate());
                                    break;
                            }
                        }
                        let chunks = [];
                        bodyPipe.on("data", chunk => chunks.push(chunk));
                        bodyPipe.on("error", err => reject(err));
                        bodyPipe.on("close", () => {
                            simpleRes.body = Buffer.concat(chunks);
                            resolve(simpleRes);
                        });
                        bodyPipe.write(res["body"], err => bodyPipe.destroy(err));
                    }
                    else {
                        resolve(simpleRes);
                    }
                });
            });
            typeof handler == "function" && await handler(null, res);
            return res;
        }
        catch (err) {
            typeof handler == "function" && await handler(err, null);
            throw err;
        }
    }

    static linesToHeaders(lines) {
        const headers = {};
        lines.split(/\r?\n/g).forEach(line => {
            line = line.trim();
            if (line) {
               const divideI = line.indexOf(": ");
               if (divideI > -1) {
                   headers[line.substring(0, divideI)] = line.substring(divideI + 2);
               }
            }
        });
        return headers;
    }
}

module.exports = async function useProxy(page, proxy, enableCache = true) {
    page["_proxy"] = proxy;
    page["_enableCacheInProxy"] = enableCache;
    await page.setRequestInterception(true);
    if (!page["_proxyHandler"]) {
        const _proxyHandler = async (req) => {
            const proxy = page["_proxy"];
            const enableCache = page["_enableCacheInProxy"];

            if (req["_interceptionHandled"] || !req["_allowInterception"]) {
                return;
            }
            else if (proxy && req.url().startsWith("http")) {
                if (!req.isNavigationRequest()) {
                    const responseCache = enableCache ? await page.evaluate(url => {
                        const cache = localStorage.getItem(url);
                        if (cache) {
                            if (parseInt(cache.substring(0, cache.indexOf("\n"))) <= new Date().getTime()) {
                                localStorage.removeItem(url);
                            }
                            else {
                                return cache;
                            }
                        }
                    }, req.url()).catch(err => {}) : null;
                    if (responseCache) {
                        let [expires, statusCodeStr, bodyBase64] = responseCache.split("\n");
                        const statusCode = +statusCodeStr;
                        const body = Buffer.from(bodyBase64, "base64");
                        await req.respond({
                            status: statusCode,
                            headers: {
                                cache: "from-local-storage"
                            },
                            body: body
                        });
                        return;
                    }
                }

                const options = {
                    url: req.url(),
                    method: req.method(),
                    headers: req.headers(),
                    body: req.postData(),
                    proxy: proxy
                };

                try {
                    if (options.headers && (options.headers.cookie == null || options.headers.Cookie == null)) {
                        const cookies = await page.cookies(options.url);
                        if (cookies.length) {
                            // console.log(options.url + "\n"
                            //     + cookies.map(item => item.name + "=" + item.value + "; domain=" + item.domain).join("\n") + "\n");
                            options.headers.cookie = cookies.map(item =>
                                item.name + "=" + item.value).join("; ");
                        }
                    }
                    const proxyRes = await RequestUtil.simple(options);
                    const headers = proxyRes.headers;
                    for (let name in headers) {
                        const value = headers[name];

                        if (name == "set-cookie") {
                            if (value.length == 0) {
                                headers[name] = ("" + value[0]);
                            }
                            else {
                                const setCookies = [];
                                for (let item of value) {
                                    const setCookie = {
                                        name: null,
                                        value: null
                                    };
                                    item.split("; ").forEach((keyVal, keyValI) => {
                                        const eqI = keyVal.indexOf("=");
                                        let key;
                                        let value;
                                        if (eqI > -1) {
                                            key = keyVal.substring(0, eqI);
                                            value = keyVal.substring(eqI + 1);
                                        }
                                        else {
                                            key = keyVal;
                                            value = "";
                                        }
                                        const lowerKey = key.toLowerCase();

                                        if (keyValI == 0) {
                                            setCookie.name = key;
                                            setCookie.value = value;
                                        }
                                        else if (lowerKey == "expires") {
                                            const expires = new Date(value).getTime();
                                            if (!isNaN(expires)) {
                                                setCookie.expires = +(expires / 1000).toFixed(0);
                                            }
                                        }
                                        else if (lowerKey == "max-age") {
                                            if (!setCookie.expires) {
                                                const expires = +value;
                                                if (!isNaN(expires)) {
                                                    setCookie.expires = expires;
                                                }
                                            }
                                        }
                                        else if (lowerKey == "path" || key == "domain") {
                                            setCookie[lowerKey] = value;
                                        }
                                        else if (lowerKey == "samesite") {
                                            setCookie.httpOnly = true;
                                        }
                                        else if (lowerKey == "httponly") {
                                            setCookie.httpOnly = true;
                                        }
                                        else if (lowerKey == "secure") {
                                            setCookie.secure = true;
                                        }
                                    });
                                    headers["set-cookie-" + setCookies.length] = item;
                                    setCookies.push(setCookie);
                                }
                                await page.setCookie(...setCookies).catch(err => {});
                                delete headers[name];
                            }
                        }
                        else if (typeof value != "string") {
                            if (value instanceof Array) {
                                headers[name] = JSON.stringify(value);
                            }
                            else {
                                headers[name] = "" + value;
                            }
                        }
                    }

                    if (!req.isNavigationRequest()) {
                        const expires = new Date(headers.expires || headers.Expires).getTime();
                        if (enableCache && expires > new Date().getTime()) {
                            const bodyBase64 = proxyRes.body.toString("base64");
                            const responseCache = `${expires}\n${proxyRes.status}\n${bodyBase64}`;
                            await page.evaluate((url, responseCache) => {
                                localStorage.setItem(url, responseCache);
                            }, req.url(), responseCache).catch(err => {});
                        }
                    }

                    await req.respond(proxyRes).catch(err => {});
                }
                catch(err) {
                    await req.abort("failed").catch(err => {});
                }
            }
        };
        page.on("request", _proxyHandler);
    }
}