import {mfSsrTransform} from "./microfrontend-server-side-rendering-transform";
const { PassThrough } = require('stream');

function streamToString (stream) {
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

test('mf ssr transform stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: [],
            runtimeLinks: [],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\"></mf-app></body></html>")
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><mf-app runtimes=\"\" module-src=\"/mf/bundle.js\" name=\"@foo/bar\"><div>mf ssr content</div></mf-app></body></html>")
});

test('mf ssr transform in chunked stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: [],
            runtimeLinks: [],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\">")
    mockedStream.push("</mf-app></body></html>");
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><mf-app runtimes=\"\" module-src=\"/mf/bundle.js\" name=\"@foo/bar\"><div>mf ssr content</div></mf-app></body></html>")
});

test('mf ssr transform multiple mf apps in chunked stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: [],
            runtimeLinks: [],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\">")
    mockedStream.push("</mf-app><div>normal content</div><mf-app name=\"@baz/foobar\"><!-- skeleton wich will be removed by ssr -->");
    mockedStream.push("</mf-app></body></html>");
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><mf-app runtimes=\"\" module-src=\"/mf/bundle.js\" name=\"@foo/bar\"><div>mf ssr content</div></mf-app><div>normal content</div><mf-app runtimes=\"\" module-src=\"/mf/bundle.js\" name=\"@baz/foobar\"><div>mf ssr content</div></mf-app></body></html>")
});

test('mf ssr with css transform stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: ["some.css"],
            runtimeLinks: [],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\"></mf-app></body></html>")
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><link rel=\"stylesheet\" href=\"some.css\"><mf-app runtimes=\"\" module-src=\"/mf/bundle.js\" name=\"@foo/bar\"><div>mf ssr content</div></mf-app></body></html>")
});


test('mf ssr transform ignores lazy mf apps in stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: [],
            runtimeLinks: [],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\" lazy></mf-app></body></html>")
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\" lazy></mf-app></body></html>")
});


test('mf ssr transform adds runtimes as arg to mf apps in stream', async () => {
    const transform = mfSsrTransform(async (name: string, opts: object) => {
        return {
            moduleSrc: "/mf/bundle.js",
            cssLinks: [],
            runtimeLinks: ["@common/some-runtime"],
            html: async () => `<div>mf ssr content</div>`
        }
    });

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><body><h1>Hi</h1><mf-app name=\"@foo/bar\"></mf-app></body></html>")
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><body><h1>Hi</h1><mf-app runtimes=\"@common/some-runtime\" module-src=\"/mf/bundle.js\" name=\"@foo/bar\"><div>mf ssr content</div></mf-app></body></html>")
});