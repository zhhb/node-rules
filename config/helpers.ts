import * as path from 'path';

let _root = path.resolve(__dirname, '..');
export function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [_root].concat(args));
}

