import {parseName} from "./parse-name";

[
    { input: "@scope/name", expected: { scope: "scope", name: "name"} },
    { input: "@some-longer-scope/a", expected: { scope: "some-longer-scope", name: "a"} },
].forEach(testDef => {
    test(`test parse name for ${testDef.input}`, () => {
        expect(parseName(testDef.input)).toEqual(testDef.expected);
    });
});

test("invalid name throws error", () => {
    let error = false;

    try {
        parseName("scope/name")
    } catch(e) {
        error = true;
    }

    expect(error).toBe(true);
})