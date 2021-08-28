import {r, combineRoutes} from '@marblejs/core';
import { map } from 'rxjs/operators';
import * as fs from 'fs';
import {envConfigEither} from "../env-config.effect";
import {ContentType} from "@marblejs/core/dist/+internal/http";

const jsBundlePath = envConfigEither("MF_CONFIG_JS_BUNDLE_PATH", "/app-client/dist/mf-orchestrator.umd.js");
const jsModuleShimPath = envConfigEither("MF_CONFIG_JS_MODULE_SHIM_PATH", "/app-client/dist/es-module-shims.js");


const getJsFile$ = r.pipe(
    r.matchPath('/main.umd.js'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
        map(() => fs.createReadStream(jsBundlePath())),
        map(body => ({
            headers: {
                "Content-Type": ContentType.APPLICATION_JAVASCRIPT
            },
            body
        })),
    )),
);


const getEsModuleShimFile$ = r.pipe(
    r.matchPath('/es-module-shims.js'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
        map(() => fs.createReadStream(jsModuleShimPath())),
        map(body => ({
            headers: {
                "Content-Type": ContentType.APPLICATION_JAVASCRIPT
            },
            body
        })),
    )),
);


export const assets$ = combineRoutes('/assets', [
    getJsFile$,
    getEsModuleShimFile$
]);

