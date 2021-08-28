import {combineRoutes, HttpError, HttpRequest, HttpStatus, r, useContext} from '@marblejs/core';
import {map, mergeMap} from 'rxjs/operators';
import { ContentType } from "@marblejs/core/dist/+internal/http";
import {MicrofrontendServiceDiscoverySubjectToken} from "../service-discovery.effect";
import {bodyParser$} from "@marblejs/middleware-body";
import {BehaviorSubject, of, throwError} from "rxjs";
import {
    AppDetails,
    MicrofrontendConfiguration,
    MicrofrontendConfigurations,
    RuntimeDetails,
    ServiceDetails
} from "../../model/microfrontends";
import {fromPromise} from "rxjs/internal-compatibility";
import {request} from "../request.effect";
import {filterProxyRequestHeaders} from "../header.effect";
import {assets$} from "./assets.effects";
import {findApp, findRuntime, findService} from "../../workflows/helper/find-in-service-discovery";
import {forwardResult} from "../forward-result.effect";

const configRoute$ = r.pipe(
    r.matchPath('/'),
    r.matchType('GET'),
    r.use(bodyParser$()),
    r.useEffect((req$, ctx) => {

        const serviceDiscoverySubject = useContext(MicrofrontendServiceDiscoverySubjectToken)(ctx.ask);

        // const request: any = "";
        // request.useEffect("/fsdfsf", {});

        return req$
            .pipe(
                mergeMap(() => serviceDiscoverySubject.asObservable()),
                map(body => ({
                    headers: {
                        "Content-Type": ContentType.APPLICATION_JSON
                    },
                    body
                }))
            );
    }));


const mapMicrofrontendDetails = (serviceDiscoverySubject: BehaviorSubject<MicrofrontendConfigurations>) => mergeMap((req: HttpRequest) => {
    // @ts-ignore
    const name: string = req.params.name;
    let appDetails: AppDetails;
    try {
        appDetails = findApp(serviceDiscoverySubject.getValue())(name);
    } catch (e) {
        return throwError(
            new HttpError((e as Error).message, HttpStatus.BAD_REQUEST)
        );
    }

    return of({
        req,
        name,
        scope: appDetails.name.scope,
        appName: appDetails.name.name,
        appUrl: appDetails.route,
        config: appDetails.config
    });
});

const mapMicrofrontendServiceDetails = (serviceDiscoverySubject: BehaviorSubject<MicrofrontendConfigurations>) => mergeMap((req: HttpRequest) => {
    // @ts-ignore
    const name: string = req.params.name;
    let serviceDetails: ServiceDetails;
    try {
        serviceDetails = findService(serviceDiscoverySubject.getValue())(name);
    } catch (e) {
        return throwError(
            new HttpError((e as Error).message, HttpStatus.BAD_REQUEST)
        );
    }

    return of({
        req,
        name,
        scope: serviceDetails.name.scope,
        serviceName: serviceDetails.name.name,
        serviceUrl: serviceDetails.serviceUrl,
        config: serviceDetails.config
    });
});

const mapMicrofrontendRuntimeDetails = (serviceDiscoverySubject: BehaviorSubject<MicrofrontendConfigurations>) => mergeMap((req: HttpRequest) => {
    // @ts-ignore
    const name: string = req.params.name;
    let runtimeDetails: RuntimeDetails;
    try {
        runtimeDetails = findRuntime(serviceDiscoverySubject.getValue())(name);
    } catch (e) {
        return throwError(
            new HttpError((e as Error).message, HttpStatus.BAD_REQUEST)
        );
    }

    return of({
        req,
        name,
        scope: runtimeDetails.name.scope,
        serviceName: runtimeDetails.name.name,
        runtimeUrl: runtimeDetails.runtimeUrl,
        config: runtimeDetails.config
    });
});

const doMicrofrontendRequest = (originalRequest: HttpRequest, url: string, config: MicrofrontendConfiguration) => {
    try {
        return fromPromise(request(config.address)(url, originalRequest.method, filterProxyRequestHeaders(originalRequest.headers)))
            .pipe(map((response) => ({
                req: originalRequest,
                config,
                response
            })));
    } catch (e) {
        return of(new HttpError("Unable to connect to microfrontend", HttpStatus.SERVICE_UNAVAILABLE));
    }
}

const getMicrofrontendService$ = r.pipe(
    r.matchPath('/mf/service/:name'),
    r.matchType('GET'),
    r.useEffect((req$, ctx) => {
        const serviceDiscoverySubject = useContext(MicrofrontendServiceDiscoverySubjectToken)(ctx.ask);

        HttpStatus
        return req$.pipe(
            mapMicrofrontendServiceDetails(serviceDiscoverySubject),
            map(({req, serviceUrl}) => ({
                status: HttpStatus.FOUND,
                headers: {
                    "Location": serviceUrl
                }
            }))
        );
    })
);

const getMicrofrontendRuntime$ = r.pipe(
    r.matchPath('/mf/runtime/:name'),
    r.matchType('GET'),
    r.useEffect((req$, ctx) => {
        const serviceDiscoverySubject = useContext(MicrofrontendServiceDiscoverySubjectToken)(ctx.ask);

        return req$.pipe(
            // get runtime details from request
            mapMicrofrontendRuntimeDetails(serviceDiscoverySubject),
            // request runtime definition from microfrontend
            mergeMap(({req, runtimeUrl, config}) => doMicrofrontendRequest(req, runtimeUrl, config)),
            // return result from microfrontend back without any further modifications
            forwardResult()
        );
    })
);

const getMicrofrontendHtml$ = r.pipe(
    r.matchPath('/mf/:name'),
    r.matchType('GET'),
    r.useEffect((req$, ctx) => {

        const serviceDiscoverySubject = useContext(MicrofrontendServiceDiscoverySubjectToken)(ctx.ask);

        return req$
            .pipe(
                mapMicrofrontendDetails(serviceDiscoverySubject),
                mergeMap(({req, appUrl, config}) => doMicrofrontendRequest(req, appUrl, config)),
                forwardResult()
            );
    }));

export const api$ = combineRoutes('/_mf-api', [
    configRoute$,
    getMicrofrontendService$,
    getMicrofrontendRuntime$,
    getMicrofrontendHtml$,
    assets$
]);

