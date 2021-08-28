import {HttpError, HttpRequest, HttpStatus, r, useContext} from "@marblejs/core";
import {map, mergeMap} from "rxjs/operators";
import {MicrofrontendServiceDiscoverySubjectToken} from "../service-discovery.effect";
import {MicrofrontendConfiguration, MicrofrontendConfigurations} from "../../model/microfrontends";
import {of, throwError} from "rxjs";
import * as micromatch from "micromatch";
import {request} from "../request.effect";
import {fromPromise} from "rxjs/internal-compatibility";
import {ContentType} from "@marblejs/core/dist/+internal/http";
import {filterProxyRequestHeaders} from "../header.effect";
import {filterHeaders} from "../../common/filter-headers";
import {ssrWorkflow} from "../../workflows/mf-server-side-rendering";

export const findConfigByRoute = (req: HttpRequest, configs: MicrofrontendConfigurations): MicrofrontendConfiguration | undefined =>
    Object.values(configs).find(c => micromatch.isMatch(req.url,  c.routes));

export const mapRequestToConfig = () => mergeMap(({req, configs}: { req: HttpRequest, configs: MicrofrontendConfigurations}) => {
    const config = findConfigByRoute(req, configs)

    // if no microfrontend is registered to handle the incomming request we return 404
    if (config === undefined) {
        return throwError(new HttpError("No Microfrontend Found To Handle Request", HttpStatus.NOT_FOUND))
    }

    // else we return the found mf config for further processing
    return of({
        req,
        config
    });
});

export const proxyRequest = () => mergeMap(({req, config}: {req: HttpRequest, config: MicrofrontendConfiguration}) => {
    try {
        return fromPromise(request(config.address)(req.url, req.method, filterProxyRequestHeaders(req.headers), req.body as any))
            .pipe(map((response) => ({
                req,
                config,
                response
            })));
    } catch (e) {
        console.log("Unable to connect to microfrontend: ", e);
        return of(new HttpError("Unable to connect to microfrontend", HttpStatus.SERVICE_UNAVAILABLE));
    }
});

export const rootApi$ = r.pipe(
    r.matchPath('/(.*)'),
    r.matchType('*'),
    r.useEffect((req$, ctx) => {

        // get observable to get latest mf config
        const serviceDiscoverySubject = useContext(MicrofrontendServiceDiscoverySubjectToken)(ctx.ask);

        const transformWithServerSideRendering = ssrWorkflow(serviceDiscoverySubject, request);
        return req$
            // combine request and mf configs
            .pipe(
                map(req => ({ req: req, configs: serviceDiscoverySubject.getValue() })),
                mapRequestToConfig(),
                proxyRequest(),
                map((result) => {
                    if (result instanceof HttpError) {
                        return result;
                    }

                    const { response } = result;
                    const headersToRemove: string[] = [];
                    let bodyStream = response.body;

                    const contentType = response.headers["content-type"] || "";
                    // if response type is html we parse it for microfrontend includes
                    if (contentType.toLowerCase().startsWith(ContentType.TEXT_HTML)) {
                        // content-length is no longer valid as we add some content
                        headersToRemove.push("content-length");

                        // TODO: we don't know the total length as we want to load content async (for ssr)
                        // as per http spec its not required. But there are some mentions that it would be better to have it.
                        // https://stackoverflow.com/questions/15991173/is-the-content-length-header-required-for-a-http-1-0-response/15995101

                        // TODO: do we need to add gzip and/or deflate decoding to supported compressed responses from servers?
                        // not as part of the initial implementation.

                        // TODO: add preload link http header for main script
                        // TODO: perf improvement idea: support Link <@scope/mf-name> rel=preload Links and resolve to real scripts to preload. This improves performance when executed.

                        bodyStream = transformWithServerSideRendering(bodyStream);
                    }

                    headersToRemove.push("content-type"); // remove to prevent duplication (see comment below)
                    const responseHeaders = filterHeaders(headersToRemove)(filterProxyRequestHeaders(response.headers));

                    return ({
                        headers: {
                            ...responseHeaders,

                            // override content-type to prevent duplication
                            // marble need upper case links for now, so we map it,
                            // https://github.com/marblejs/marble/issues/311
                            "Content-Type": contentType
                        },
                        body: bodyStream
                    });
                })
            );
    })
);
