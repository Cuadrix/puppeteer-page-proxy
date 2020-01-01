# puppeteer-page-proxy
Additional Node.js module to use with '[puppeteer](https://www.npmjs.com/package/puppeteer)' for setting proxies per page basis.

Uses **(http | https | socks)-proxy-agent** to achieve the desired results.

This small module consists of a class and a function taken from [ppspider](https://github.com/xiyuan-fengyu/ppspider).

All credit for the original code goes to the author [@xiyuan-fengyu](https://github.com/xiyuan-fengyu).

## Installation
```
npm i puppeteer-page-proxy
```
## Examples
#### General usage:
```javascript
const puppeteer = require('puppeteer');
var useProxy = require('puppeteer-page-proxy');

(async () => {
    let site = 'https://example.com';
    const browser = await puppeteer.launch({headless: false});

    const page1 = await browser.newPage();
    await useProxy(page1, 'http://host:port');
    await page1.goto(site);

    const page2 = await browser.newPage();
    await useProxy(page2, 'https://host:port');
    await page2.goto(site);

    const page3 = await browser.newPage();
    await useProxy(page3, 'socks://host:port');
    await page3.goto(site);
})();
```
#### Reassign proxy of a page:
```javascript
const page1 = await browser.newPage();
await useProxy(page1, 'http://my-host:port');
await page1.goto(site);

await useProxy(page1, 'socks://:another-host:port', false);
await page1.goto(site);
```
