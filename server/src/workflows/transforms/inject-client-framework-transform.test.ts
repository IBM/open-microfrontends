import {injectClientFrameworkTransform, ScriptLoadingStrategy} from "./inject-client-framework-transform";
const { PassThrough } = require('stream');

function streamToString (stream) {
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

test('inject framework script in stream', async () => {
    const transform = injectClientFrameworkTransform("/js/bundle.js", ScriptLoadingStrategy.DEFER);

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><head><title>Test</title></head></html>")
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><head><style>mf-app{display:block;contain: content;}</style><script defer src=\"/_mf-api/assets/es-module-shims.js\"></script><script src=\"/js/bundle.js\" defer type=\"module-shim\"></script><title>Test</title></head></html>")
});

test('inject framework script in chunked stream', async () => {
    const transform = injectClientFrameworkTransform("/js/bundle.js", ScriptLoadingStrategy.DEFER);

    const mockedStream = new PassThrough();
    const resultPromise = streamToString(mockedStream.pipe(transform));

    mockedStream.push("<html><head>")
    mockedStream.push("<title>Test</title></head></html>");
    mockedStream.end();

    const result = await resultPromise;
    expect(result).toEqual("<html><head><style>mf-app{display:block;contain: content;}</style><script defer src=\"/_mf-api/assets/es-module-shims.js\"></script><script src=\"/js/bundle.js\" defer type=\"module-shim\"></script><title>Test</title></head></html>")
});

