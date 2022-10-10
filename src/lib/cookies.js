const {CookieJar} = require("tough-cookie");
const CDP = require("./cdp");

// Parse single raw cookie string to a cookie object for the browser
const parseCookie = (rawCookie, domain) => {
    const cookie = {name: "", value: "", domain, path: "/", secure: false, httpOnly: false, sameSite: "Lax", expires: undefined};
    const pairs = rawCookie.split(/; */);
    for (let i = 0; i < pairs.length; i++) {
        // Split to key value pair e.g. key=value
        const pair = pairs[i].split(/=(.*)/, 2);
        // Trim and assign key and value
        let key = pair[0].trim();
        let value = pair[1] ? pair[1].trim() : "";
        // Remove surrounding quotes from value if exists
        value = value.replace(/^"(.*)"$/, "$1");
        switch (key.toLowerCase()) {
            case "domain": cookie.domain = value; break;
            case "path": cookie.path = value; break;
            case "secure": cookie.secure = true; break;
            case "httponly": cookie.httpOnly = true; break;
            case "samesite":
                const firstChar = value[0].toUpperCase();
                const restChars = value.slice(1).toLowerCase();
                cookie.sameSite = firstChar + restChars;
                break;
            case "max-age":
                // Current time and 'max-age' in seconds
                const currentTime = new Date().getTime() / 1000;
                const maxAge = parseInt(value);
                cookie.expires = Math.round(currentTime + maxAge);
                break;
            case "expires":
                // If cookie expires hasn't already been set by 'max-age'
                if (!cookie.expires) {
                    const time = new Date(value).getTime();
                    cookie.expires = Math.round(time / 1000);
                }
                break;
            default: if (i < 1) {cookie.name = key; cookie.value = value}
        }
    }
    return cookie;
}

// Format single browser cookie object to tough-cookie object
const formatCookie = (cookie) => {
    const currentDate = new Date().toISOString();
    return {
        key: cookie.name,
        value: cookie.value,
        expires: (cookie.expires === -1) ? "Infinity" : new Date(cookie.expires * 1000).toISOString(),
        domain: cookie.domain.replace(/^\./, ""),
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        hostOnly: !cookie.domain.startsWith("."),
        creation: currentDate,
        lastAccessed: currentDate
    };
};

// Responsible for getting and setting browser cookies
class CookieHandler extends CDP {
    constructor(request) {
        super(request._client || request.client);
        this.url =
            (request.isNavigationRequest() || request.frame() == null)
            ? request.url()
            : request.frame().url();
        this.domain = (this.url) ? new URL(this.url).hostname : "";
    }
    // Parse an array of raw cookies to an array of cookie objects
    parseCookies(rawCookies) {
        return rawCookies.map((rawCookie) => {
            return parseCookie(rawCookie, this.domain);
        });
    };
    // Format browser cookies to tough-cookies
    formatCookies(cookies) {
        return cookies.map((cookie) => {
            return formatCookie(cookie);
        });
    };
    // Get browser cookies of current page/url
    async getCookies() {
        const browserCookies = await this.Network.getCookies({urls: [this.url]});
        const toughCookies = this.formatCookies(browserCookies);
        // Add cookies to cookieJar
        const cookieJar = CookieJar.deserializeSync({
                version: 'tough-cookie@4.1.2',
                storeType: 'MemoryCookieStore',
                rejectPublicSuffixes: true,
                cookies: toughCookies
        });
        return cookieJar;
    }
    // Set cookies to browser from "set-cookie" header
    async setCookies(rawCookies) {
        const browserCookies = this.parseCookies(rawCookies);
        // Delete old cookies before setting new ones
        for (let i = 0; i < browserCookies.length; i++) {
            const cookie = browserCookies[i];
            const badCookie = {
                name: cookie.name,
                url: this.url,
                domain: cookie.domain,
                path: cookie.path
            };
            await this.Network.deleteCookies(badCookie);
        }
        // Store cookies in the browser
        await this.Network.setCookies({cookies: browserCookies});
    }
}

module.exports = CookieHandler;