import {parseLinkByRel} from "./parse-links";

[
    { input: "</some.css>; rel=\"stylesheet\"", expected: { stylesheet: ["/some.css"] } },
    { input: "</some.css>; rel=\"preload\" as=\"stylesheet\"", expected: { preload: ["/some.css"] } },
    { input: "</some/module.js>; rel=\"module-src\"", expected: { "module-src": ["/some/module.js"] } },
    { input: "</some.css>; rel=\"stylesheet\", </second.css>; rel=\"stylesheet\", </some/module.js>; rel=\"module-src\"", expected: { stylesheet: ["/some.css", "/second.css"], "module-src": ["/some/module.js"] } },
].forEach(testDef => {
    test(`parse link by rel: ${testDef.input}`, () => {
        expect(parseLinkByRel(testDef.input)).toEqual(testDef.expected);
    });
});
