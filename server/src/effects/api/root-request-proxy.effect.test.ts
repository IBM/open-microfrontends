import {findConfigByRoute} from "./root-request-proxy.effect";
import {MicrofrontendConfigurations} from "../../model/microfrontends";

const TEST_CONFIG: MicrofrontendConfigurations = {
    "mf-test": {
        address: "http://localhost:3000",
        scope: "mf-test",
        routes: [
            "/foo/**"
        ],
        apps: {},
        services: {},
        runtimes: {}
    },
    "mf-bar": {
        address: "http://localhost:3001",
        scope: "mf-bar",
        routes: [
            "/bar/some/nested/url/*",
            "/bar/some/{1..3}.png"
        ],
        apps: {},
        services: {},
        runtimes: {}
    }
};

[
    // test some URLs for mf-test microfrontend configuration
    { url: "/foo", handledbyMicrfrontend: "mf-test"},
    { url: "/foo/bar", handledbyMicrfrontend: "mf-test"},
    { url: "/foo/bar/baz", handledbyMicrfrontend: "mf-test"},
    { url: "/foo/a/b/c/d/e/f/g/h/i/j", handledbyMicrfrontend: "mf-test"},
    { url: "/foo/123.png", handledbyMicrfrontend: "mf-test"},

    // test some routes thate aren't handled by any microfrontend
    { url: "/", handledbyMicrfrontend: undefined},
    { url: "/not/defined", handledbyMicrfrontend: undefined},
    { url: "/some/url.html", handledbyMicrfrontend: undefined},

    // test some URLs for mf-bar microfrontend configuration
    { url: "/bar/some/nested/url/", handledbyMicrfrontend: undefined}, // segments with one * must be defined, so this route is not handled
    { url: "/bar/some/nested/url/test", handledbyMicrfrontend: "mf-bar"},
    { url: "/bar/some/nested/url/test/more", handledbyMicrfrontend: undefined}, // only one * was used, so nested segments aren't covered
    { url: "/bar/some", handledbyMicrfrontend: undefined},
    { url: "/bar/some/t.png", handledbyMicrfrontend: undefined},
    { url: "/bar/some/1.png", handledbyMicrfrontend: "mf-bar"},
    { url: "/bar/some/2.png", handledbyMicrfrontend: "mf-bar"},
    { url: "/bar/some/3.png", handledbyMicrfrontend: "mf-bar"},
].forEach(testDef => test(`findConfigByRoute with url ${testDef.url}`, () => {
    const c = findConfigByRoute({url: testDef.url} as any, TEST_CONFIG);

    if (!testDef.handledbyMicrfrontend) {
        expect(c).toBeUndefined();
    } else {
        expect(c!.scope).toBe(testDef.handledbyMicrfrontend);
    }
}));

test(`findConfigByRoute for root wildcard url`, () => {
    const testConfig = {
        "mf-root-test": {
            address: "http://localhost:3000",
            scope: "mf-root-test",
            routes: [
                "/**"
            ],
            apps: {},
            services: {},
            runtimes: {}
        },
    };

    let c = findConfigByRoute({url: "/foo"} as any, testConfig);
    expect(c!.scope).toBe("mf-root-test");

    c = findConfigByRoute({url: "/foo/bar"} as any, testConfig);
    expect(c!.scope).toBe("mf-root-test");

    c = findConfigByRoute({url: "/"} as any, testConfig);
    expect(c!.scope).toBe("mf-root-test");

})

