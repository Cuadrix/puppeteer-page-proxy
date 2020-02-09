const url = require("url");

module.exports = (host) => {
    const proxy = url.parse(host);
    if (proxy.protocol == null
        || !(/^((https?)|(socks[45]?)):?$/i.test(proxy.protocol))
        || proxy.hostname == null || proxy.hostname.length == 0
        || proxy.port == null || proxy.port < 0 || proxy.port > 65535) {
        throw new Error(`${host} -> Invalid proxy`);
    }
};