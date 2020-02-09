# puppeteer-page-proxy <img src="https://i.ibb.co/kQrN9QJ/puppeteer-page-proxy-logo.png" align="right" width=150 height=150/>
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
- `proxy` <[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> Proxy to use in the current page.
  * Begins with a protocol e.g. **http://**, **https://**, **socks://**

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
    
## Examples
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
#
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
    page.on('request', req => {
        useProxy(req, proxy); // 'req' as argument
    });
    await page.goto(site);
})();
```
When changing proxies this way, the request object itself is passed as the first argument. Now 'proxy' can be changed every request.
Leaving it as is will have the same effect as `useProxy(page, proxy)`, meaning that the same proxy will be used for all requests within the page.

Using it in other request listeners is also straight forward:
```js
await page.setRequestInterception(true);
page.on('request', req => {
    if (req.resourceType() === 'image') {
        req.abort();
    } else {
        useProxy(req, proxy);
    }
});
```
Since all requests can be handled exactly once, it's not possible to call other interception methods (e.g. [request.abort](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestaborterrorcode), [request.continue](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestcontinueoverrides)) after calling `useProxy`, without getting a *'Request is already handled!'* error message. This is because `puppeteer-page-proxy` internally calls [request.respond](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#requestrespondresponse) which fulfills the request.

**NOTE:** It is necessary to set [page.setRequestInterception](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagesetrequestinterceptionvalue) to true when setting proxies this way, otherwise the function will fail.

#
#### Authentication:
```js
const proxy = 'https://login:pass@host:port';
```
#### Lookup IP used by proxy -> Useful in headless environment:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    const site = 'https://example.com';
    const proxy1 = 'http://host:port';
    const proxy2 = 'https://host:port';
    
    const browser = await puppeteer.launch({headless: false});

    /**1*/
    const page1 = await browser.newPage();
    await useProxy(page1, proxy1);
    let data = await useProxy.lookup(page1); // Waits until done, 'then' continues
        console.log(data.ip);
    await page1.goto(site);
    
    /**2*/
    const page2 = await browser.newPage();
    await useProxy(page2, proxy2);
    useProxy.lookup(page2).then(data => {   // Executes and 'comes back' once done
        console.log(data.ip);
    });
    await page2.goto(site);
})();
```
## Dependencies
- [Got](https://github.com/sindresorhus/got)
- [http-proxy-agent](https://github.com/TooTallNate/node-http-proxy-agent)
- [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent)
- [socks-proxy-agent](https://github.com/TooTallNate/node-socks-proxy-agent)
- [tough-cookie](https://github.com/salesforce/tough-cookie)
