const lookup = async (page, lookupService = "https://api.ipify.org?format=json", isJSON = true, timeout = 30000) => {
    const XMLHttpRequest = async () => {
        return await page.evaluate((lookupService, timeout, isJSON) => {
            return new Promise(resolve => {
                var req = new XMLHttpRequest();
                req.open("GET", lookupService, true);
                req.timeout = timeout;
                req.onload = () => {
                    if (req.status >= 200 && req.status <= 299) {
                        resolve(isJSON ? JSON.parse(req.responseText) : req.responseText);
                    } else {
                        resolve(xhrFailed(`Request from [${window.location.href.slice(0, -1)}] to [${lookupService}] failed with status code ${req.status}`));
                    }
                };
                req.ontimeout = e => {
                    resolve(xhrFailed(`Request from [${window.location.href.slice(0, -1)}] to [${lookupService}] timed out -> ${req.timeout} ms`));
                };
                req.send();
            });
        }, lookupService, timeout, isJSON);
    };
    try {
        await page.setBypassCSP(true);
        const errName = "xhrFailed";
        if (!page._pageBindings.has(errName)) {
            await page.exposeFunction(errName, reason => {
                console.error(reason);
                return;
            });
        }
        return await XMLHttpRequest();
    } catch(error) {
        if (error.message === "Execution context was destroyed, most likely because of a navigation." || error.message === "Execution context was destroyed.")
            return await XMLHttpRequest();
    }
};
module.exports = lookup;