# puppeteer-page-proxy <img src="https://i.ibb.co/kQrN9QJ/puppeteer-page-proxy-logo.png" align="right" width=150 height=150/>
Additional Node.js module to use with '[puppeteer](https://www.npmjs.com/package/puppeteer)' for setting proxies per page basis.

Uses **(http | https | socks)-proxy-agent** to achieve the desired results.

This small module consists of a class and a function taken from [ppspider](https://github.com/xiyuan-fengyu/ppspider).

All credit for the original code goes to the author [@xiyuan-fengyu](https://github.com/xiyuan-fengyu).

## Installation
```
npm i puppeteer-page-proxy
```

## Methods
#### PageProxy(page, proxy[, enableCache])

* `page` <[object](https://developer.mozilla.org/en-US/docs/Glossary/Object)> Page object to set a proxy for.
* `proxy` <[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> Proxy to use in the current page. Must begin with a protocol e.g. **http://**, **https://**, **socks://**.
* `enableCache` <[boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean)> Whether to enable caching. Defaults to `true`.

#### PageProxy.lookup(page[, lookupService, isJSON, timeout])

* `page` <[object](https://developer.mozilla.org/en-US/docs/Glossary/Object)> Page object to execute the request on.
* `lookupService` <[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> External lookup service to request data from. Fetches data from `api.ipify.org` by default.
* `isJSON` <[boolean](https://developer.mozilla.org/en-US/docs/Glossary/Boolean)> Whether to [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) the received response. Defaults to `true`.
* `timeout` <[number](https://developer.mozilla.org/en-US/docs/Glossary/Number)|[string](https://developer.mozilla.org/en-US/docs/Glossary/String)> Time in milliseconds after which the request times out. Defaults to `30000` ms.
* returns: <[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)> Promise which resolves to the response of the lookup request.
    
## Examples
#### General usage:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    let site = 'https://example.com';
    let proxy1 = 'http://host:port';
    let proxy2 = 'https://host:port';
    let proxy3 = 'socks://host:port';
    
    const browser = await puppeteer.launch({headless: false});

    const page1 = await browser.newPage();
    await useProxy(page1, proxy1);
    await page1.goto(site);

    const page2 = await browser.newPage();
    await useProxy(page2, proxy2);
    await page2.goto(site);

    const page3 = await browser.newPage();
    await useProxy(page3, proxy3);
    await page3.goto(site);
})();
```
#### Lookup IP used by proxy -> Useful in headless environment:
```js
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

(async () => {
    let site = 'https://example.com';
    let proxy1 = 'http://host:port';
    let proxy2 = 'https://host:port';
    
    const browser = await puppeteer.launch({headless: false});

    /**1*/
    const page1 = await browser.newPage();
    await useProxy(page1, proxy1);
    let data = await useProxy.lookup(page) // Waits until done, "then" continues
        console.log(data.ip);
    await page1.goto(site);
    
    /**2*/
    const page2 = await browser.newPage();
    await useProxy(page2, proxy2);
    useProxy.lookup(page).then(data => {   // Executes and "comes back" once done
        console.log(data.ip);
    });
    await page2.goto(site);
})();
```