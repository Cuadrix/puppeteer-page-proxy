export = useProxy;
/**
 * **Set a proxy to use in a given page or request.**
 * 
 * **Example:**
 * ```javascript
 * const proxy = "https://127.0.0.1:80";
 * const page = await browser.newPage();
 * await useProxy(page, proxy);
 * ```
 * @param page 'Page' or 'Request' object to set a proxy for.
 * @param proxy Proxy to use in the current page. Must begin with a protocol e.g. **http://**, **https://**, **socks://**.
 */
declare function useProxy(page: object, proxy: string | object): Promise<any>;
declare namespace useProxy {
/**
 * **Request data from a lookupservice.**
 *
 * **Example:**
 * ```javascript
 * await useProxy(page, proxy);
 * const data = await useProxy.lookup(page);
 * console.log(data.ip);
 * ```
 * @param page 'Page' object to execute the request on.
 * @param lookupServiceUrl External lookup service to request data from. Fetches data from `api64.ipify.org` by default.
 * @param isJSON Whether to JSON.parse the received response. Defaults to `true`.
 * @param timeout Time in milliseconds after which the request times out. Defaults to `30000` ms.
 */
	function lookup(page: object, lookupServiceUrl?: string, isJSON?: boolean, timeout?: number | string): Promise<any>;
}
