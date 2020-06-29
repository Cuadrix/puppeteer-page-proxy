const lookup = async (page, lookupService = "https://api64.ipify.org?format=json", isJSON = true, timeout = 30000) => {
    const doLookup = async () => {
        return await page.evaluate((lookupService, timeout, isJSON) => {
            return new Promise((resolve) => {
                const request = new XMLHttpRequest();
                request.timeout = timeout;
                request.onload = () => {
                    if (request.status >= 200 && request.status <= 299) {
                        resolve(isJSON ? JSON.parse(request.responseText) : request.responseText);
                    } else {resolve(onLookupFailed(
                        `Request from ${window.location.href} to ` + 
                        `${lookupService} failed with status code ${request.status}`
                    ))}
                };
                request.ontimeout = (error) => {resolve(onLookupFailed(
                    `Request from ${window.location.href} to ` +
                    `${lookupService} timed out at ${request.timeout} ms`
                ))};
                request.open("GET", lookupService, true);
                request.send();
            });
        }, lookupService, timeout, isJSON);
    };
    try {
        await page.setBypassCSP(true);
        const functionName = "$ppp_on_lookup_failed";
        if (!page._pageBindings.has(functionName)) {
            await page.exposeFunction(functionName, (failReason) => {
                console.error(failReason); return;
            });
        }
        return await doLookup();
    } catch(error) {console.error(error)}
};

module.exports = lookup;