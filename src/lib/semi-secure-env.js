;(function () {
    // shadow all sensitive global variables with `undefined`
    // warning: there are >= 201 global vars on a blank Safari page
    // there may be clever ways to tap into an `event` like `onfocus`, access it's `this`, and find a path back to the OG `window`
    const window = undefined
    const document = undefined
    const localStorage = undefined
    const sessionStorage = undefined
    const self = undefined
    const parent = undefined
    const global = undefined
    const globalThis = undefined
    // TODO ensure all scary globals are shadowed

    // UNPRIVLEDGED CODE GOES HERE
}).call({})
