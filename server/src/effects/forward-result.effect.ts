import {map} from "rxjs/operators";
import {HttpError, HttpRequest} from "@marblejs/core";
import {filterProxyRequestHeaders} from "./header.effect";
import {ResponseData} from "undici/types/client";

export type ForwardableResult = HttpError | { req: HttpRequest, response: ResponseData, [key: string]: any};

export const forwardResult = () => map((result: ForwardableResult) => {
    if (result instanceof HttpError) {
        return result;
    }

    const { response } = result;
    const bodyStream = response.body;
    const responseHeaders = filterProxyRequestHeaders(response.headers);
    return ({
        headers: {
            ...responseHeaders,
            // marble need upper case links for now, so we map it,
            // https://github.com/marblejs/marble/issues/311
            "Content-Type": responseHeaders["content-type"]
        },
        body: bodyStream
    });
})