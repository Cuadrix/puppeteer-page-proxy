export = puppeteer_page_proxy;

/**
 * **Set a proxy to use in a given page.**
 *
 * @param page Page object to set a proxy for.
 * @param proxy Proxy to use in the current page. Must begin with a protocol e.g. **http://**, **https://**, **socks://**.
 * @param enableCache Whether to enable cache for proxy in the current page. Set to `false` when reassigning the proxy of a page.
 * 
 * **Usage example:** 
 * ```javascript
 * let proxy = "https://127.0.0.1:80";
 * const page = await browser.newPage();
 * await useProxy(page, proxy);
 * ```
 */
declare function puppeteer_page_proxy(page: any, proxy: string, enableCache?: boolean): any;