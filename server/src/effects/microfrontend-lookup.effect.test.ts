import {microfrontendLookup} from "./microfrontend-lookup.effect";

test('microfrontendLookup reads all apps from environment', () => {
    process.env.MF_APP_TEST = "http://localhost:8081";
    process.env.MF_APP_FOO_BAR = "http://localhost:8082";

    const res = microfrontendLookup();

    expect(res).toContain("http://localhost:8081");
    expect(res).toContain("http://localhost:8082");
});
