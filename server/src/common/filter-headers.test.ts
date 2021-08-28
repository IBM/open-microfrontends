import {IncomingHttpHeaders} from "http";
import {filterHeaders} from "./filter-headers";

test('filter headers with blacklist', async () => {
    const headers: IncomingHttpHeaders = {
        "content-type": "applciation/json",
        "connection": "test-connection"
    };

    expect(filterHeaders(["connection"])(headers)).toEqual({
        "content-type": "applciation/json",
    });
});

test('filter headers without blacklist', async () => {
    const headers: IncomingHttpHeaders = {
        "content-type": "applciation/json",
        "connection": "test-connection"
    };

    expect(filterHeaders([])(headers)).toEqual({
        "content-type": "applciation/json",
        "connection": "test-connection"
    });
});
