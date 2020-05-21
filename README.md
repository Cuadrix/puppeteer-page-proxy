# puppeteer-page-proxy <img src="https://i.ibb.co/kQrN9QJ/puppeteer-page-proxy-logo.png" align="right" width="150" height="150">
Additional Node.js module to use with **[puppeteer](https://www.npmjs.com/package/puppeteer)** for setting proxies per page basis.

Forwards intercepted requests from the browser to Node.js where it handles the request then returns the response to the browser, changing the proxy as a result.

## Features

- Proxy per page **and** per request
- Supports **(** http, https, socks4, socks5 **)** proxies
- Authentication
- Cookie handling internally

## Installation
```
npm i puppeteer-page-proxy
```
## API
#### PageProxy(pageOrReq, proxy)

- `pageOrReq` <[object](https://developer.mozilla.org/en-US/docs/Glossary/Object)> 'Page' or 'Request' object to set a proxy for.
- `proxy` <[string](https://developer.mozilla.org/en-US/docs/Glossary/String)|[object](https://developer.mozilla.org/en-US/docs/Glossary/Object)> Proxy to use in the current page.
  * Begins with a protocol (e.g. http://, https://, socks://)
  * In the case of [proxy per request](https://github.com/Cuadrix/puppeteer-page-proxy#proxy-per-request), this can be an object with optional properites for overriding requests:\
`url`, `method`, `postData`, `headers`\
See [request.continue](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestcontinueoverrides) for more info about the above properties.
  
#### PageProxy.lookup(page[, lookupService, isJSON, timeout])

- `page` <[object](https://developer.mozilla.org/en-US/docs/Glossary/Object)> 'Page' object to execute the request on.
- `lookupService` <[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> External lookup service to request data from.
  * Fetches data from **api.ipify.org** by default.
- `isJSON` <[boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean)> Whether to [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) the received response.
  * Defaults to **true**.
- `timeout` <[number](https://developer.mozilla.org/en-US/docs/Glossary/Number)|[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> Time in milliseconds after which the request times out.
  * Defaults to **30000**.
- returns: <[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)> Promise which resolves to the response of the lookup request.

**NOTE:** By default this method expects a response in [JSON](https://en.wikipedia.org/wiki/JSON#Example) format and [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)'s it to a usable javascript object. To disable this functionality, set `isJSON` to `false`.
    
## Usage
#### Proxy per page:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    const site = 'https://example.com';
    const proxy = 'http://host:port';
    const proxy2 = 'https://host:port';
    
    const browser = await puppeteer.launch({headless: false});

    const page = await browser.newPage();
    await useProxy(page, proxy);
    await page.goto(site);

    const page2 = await browser.newPage();
    await useProxy(page2, proxy2);
    await page2.goto(site);
})();
```
To remove proxy, omit or pass in falsy value (e.g `null`):
```js
await useProxy(page, null);
```

#### Proxy per request:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    const site = 'https://example.com';
    const proxy = 'socks://host:port';

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', async req => {
        await useProxy(req, proxy);
    });
    await page.goto(site);
})();
```
The request object itself is passed as the first argument. The proxy can now be changed every request.

Using it along with other interception methods:
```js
await page.setRequestInterception(true);
page.on('request', async req => {
    if (req.resourceType() === 'image') {
        req.abort();
    } else {
        await useProxy(req, proxy);
    }
});
```

Overriding requests:
```js
await page.setRequestInterception(true);
page.on('request', async req => {
    await useProxy(req, {
        proxy: proxy,
        url: 'https://example.com',
        method: 'POST',
        postData: '404',
        headers: {
            accept: 'text/html'
        }
    });
});
```

**NOTE:** It is necessary to set [page.setRequestInterception](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagesetrequestinterceptionvalue) to true when setting proxies per request, otherwise the function will fail.

#### Authentication:
```js
const proxy = 'https://login:pass@host:port';
```

#### Lookup IP used by proxy:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    const site = 'https://example.com';
    const proxy1 = 'http://host:port';
    const proxy2 = 'https://host:port';
    
    const browser = await puppeteer.launch({headless: false});

    // 1
    const page1 = await browser.newPage();
    await useProxy(page1, proxy1);
    let data = await useProxy.lookup(page1); // Waits until done, 'then' continues
        console.log(data.ip);
    await page1.goto(site);
    
    // 2
    const page2 = await browser.newPage();
    await useProxy(page2, proxy2);
    useProxy.lookup(page2).then(data => {   // Executes and 'comes back' once done
        console.log(data.ip);
    });
    await page2.goto(site);
})();
```

## FAQ
#### How does this module work?

It takes over the task of requesting content **from** the browser to do it internally via a requests library instead. Requests that are normally made by the browser, are thus made by Node. The IP's are changed by routing the requests through the specified proxy servers using ***-proxy-agent's**. When Node gets a response back from the server, it's forwarded to the browser for completion/rendering.

#### Why am I getting _"Request is already handled!"_?

This happens when there is an attempt to handle the same request more than once. An intercepted request is handled by either [request.abort](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestaborterrorcode), [request.continue](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestcontinueoverrides) or [request.respond](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestrespondresponse) methods. Each of these methods 'send' the request to its destination. A request that has already reached its destination cannot be intercepted or handled.


#### Why does the browser show _"Your connection to this site is not secure"_?

Because direct requests from the browser to the server are being intercepted by Node, making the establishment of a secure connection between them impossible. However, the requests aren't made by the browser, they are made by Node. All `https` requests made through Node using this module are secure. This is evidenced by the connection property of the response object:


```json
connection: TLSSocket {
    _tlsOptions: {
        secureContext: [SecureContext],
        requestCert: true,
        rejectUnauthorized: true,
    },
    _secureEstablished: true,
    authorized: true,
    encrypted: true,
}
```
You can think of the warning as a false positive.

## Dependencies
- [Got](https://github.com/sindresorhus/got)
- [http-proxy-agent](https://github.com/TooTallNate/node-http-proxy-agent)
- [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent)
- [socks-proxy-agent](https://github.com/TooTallNate/node-socks-proxy-agent)
- [tough-cookie](https://github.com/salesforce/tough-cookie)
