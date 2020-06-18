const lookup = async (page, lookupService = "https://api.ipify.org?format=json", isJSON = true, timeout = 30000) => {
    const doLookup = async () => {
        return await page.evaluate((lookupService, timeout, isJSON) => {
            return new Promise((resolve) => {
                const req = new XMLHttpRequest();
                req.timeout = timeout;
                req.onload = () => {
                    if (req.status >= 200 && req.status <= 299) {
                        resolve(isJSON ? JSON.parse(req.responseText) : req.responseText);
                    } else {
                        resolve(onLookupFailed(`Request from ${window.location.href} to ${lookupService} failed with status code ${req.status}`));
                    }
                };
                req.ontimeout = (error) => {
                    resolve(onLookupFailed(`Request from ${window.location.href} to ${lookupService} timed out -> ${req.timeout} ms`));
                };
                req.open("GET", lookupService, true);
                req.send();
            });
        }, lookupService, timeout, isJSON);
    };
    try {
        await page.setBypassCSP(true);
        const functionName = "onLookupFailed";
        if (!page._pageBindings.has(functionName)) {
            await page.exposeFunction(functionName, (reason) => {
                console.error(reason);
                return;
            });
        }
        return await doLookup();
    } catch(error) {
        if (error.message.startsWith("Execution context was destroyed")) {
            return await doLookup();
        }
    }
};

module.exports = lookup;