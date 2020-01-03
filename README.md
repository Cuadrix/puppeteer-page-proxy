# puppeteer-page-proxy <img src="https://i.ibb.co/kQrN9QJ/puppeteer-page-proxy-logo.png" align="right" width=150 height=150/>
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
