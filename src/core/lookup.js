const defaults = {
    url: "https://api64.ipify.org?format=json",
    json: true,
    timeout: 30000
};

const onLookupFail = (message) => {console.error(message)}
const isOnLookupFailExposed = new WeakMap();

const lookup = async (page, lookupServiceUrl = defaults.url, isJSON = defaults.json, timeout = defaults.timeout) => {
    const doLookup = async () => {
        // Wait for network to be idle before evaluating code in page context
        await page.waitForNetworkIdle();
        return await page.evaluate((pageUrl, lookupServiceUrl, timeout, isJSON) => {
            return new Promise((resolve) => {
                const request = new XMLHttpRequest();
                request.timeout = timeout;
                request.onload = () => {
                    if (request.status >= 200 && request.status <= 299) {
                        resolve(isJSON ? JSON.parse(request.responseText) : request.responseText);
                    } else {
                        // Print message to browser and NodeJS console
                        const failMessage =
                            `Lookup request from ${pageUrl} to ${lookupServiceUrl} ` + 
                            `failed with status code ${request.status}`;
                        console.error(failMessage);
                        $ppp_onLookupFail(failMessage);
                        resolve();
                    }
                };
                request.ontimeout = () => {
                    // Print message to browser and NodeJS console
                    const timeOutMessage =
                        `Lookup request from ${pageUrl} to ${lookupServiceUrl} ` +
                        `timed out at ${request.timeout} ms`;
                    console.error(timeOutMessage);
                    $ppp_onLookupFail(timeOutMessage);
                    resolve();
                };
                request.open("GET", lookupServiceUrl, true);
                request.send();
            });
        }, page.url(), lookupServiceUrl, timeout, isJSON);
    };
    try {
        // Expose function to log error on NodeJS side
        // Deal with already exposed error by explicitly keeping track of function exposure
        if (!isOnLookupFailExposed.get(page)) {
            await page.exposeFunction("$ppp_onLookupFail", onLookupFail);
            isOnLookupFailExposed.set(page, true);
        }
        // Stop keeping track of exposure if page is closed
        if (page.isClosed()) {
            isOnLookupFailExposed.delete(page);
        }
        await page.setBypassCSP(true);
        return await doLookup();
    } catch(error) {console.log(error)}
};

module.exports = lookup;