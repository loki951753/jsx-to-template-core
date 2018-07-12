function log(){
    const tag = require('../package.json').name;

    let args = [].slice.call(arguments);
    args.unshift(`[${tag}]:`);

    console.log.apply(console, args); // eslint-disable-line no-console
}
exports.log = log;