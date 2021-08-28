import {httpListener} from '@marblejs/core';
import { logger$ } from '@marblejs/middleware-logger';
import {api$} from './effects/api/api.effects';
import {underPressure$} from "./common/middleware/under-pressure";
import {envConfigEitherAsFloat, envConfigEitherAsInt} from "./effects/env-config.effect";
import {rootApi$} from "./effects/api/root-request-proxy.effect";

const middlewares = [
    underPressure$({
        maxEventLoopDelay: envConfigEitherAsInt("MF_MAX_EVENT_LOOP_DELAY", 1000)(),
        maxEventLoopUtilization: envConfigEitherAsFloat("MF_MAX_EVENT_LOOP_UTILIZATION", 0.98)()
    }),
    logger$()
];

const effects = [
    api$,
    rootApi$
];

export const listener = httpListener({
    middlewares,
    effects,
});