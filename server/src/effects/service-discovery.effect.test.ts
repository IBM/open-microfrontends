import {mfConfigRefreshRate} from "./service-discovery.effect";

test('mfConfigRefreshRate reads value from environment and converts it to an integer type', () => {
    process.env.MF_CONFIG_REFRESH_RATE = "1000";
    expect(mfConfigRefreshRate()).toBe(1000);

    // usage of default value is already tested in the underlying used envConfig function
    // and the result is memoized so no more testing can be done here
});

