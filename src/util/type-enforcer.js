module.exports = (...args) => {
	let types = [
		"undefined", "object", "boolean", "number", "bigint", "string", "symbol", "function"
	];
	args.forEach((arg, index) => {
		if (arg.length < 2) {
			throw new Error("Too few arguments passed into the list");
		} else if (arg.length > 3) {
			throw new Error("Too many arguments passed into the list");
		} else {
			if (types.includes(arg[1])) {
				if (typeof arg[0] != arg[1]) {
					if (typeof arg[2] == "string" && arg[2].length > 0) {
						throw new TypeError(`@arg${index + 1}: ${arg[2]}`);
					} else {
						throw new TypeError(`@arg${index + 1}: Type: ${typeof arg[0]} -> expected ${arg[1]}`);
					}
				}
			} else {
				throw new Error(`@arg${index + 1}: '${arg[1]}' is not a valid data type`);
			}
		}
	});
};