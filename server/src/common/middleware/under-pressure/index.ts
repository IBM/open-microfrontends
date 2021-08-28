import {
    HttpError,
    HttpMiddlewareEffect,
    HttpStatus,
    LoggerLevel,
    LoggerTag,
    LoggerToken,
    useContext
} from "@marblejs/core";
import {throwError} from "rxjs";
import {mergeMap} from "rxjs/operators";
import {monitorEventLoopDelay} from 'perf_hooks';
import {IO} from "fp-ts/IO";

const { eventLoopUtilization } = require('perf_hooks').performance

const now: IO<number> = () => {
    const ts = process.hrtime();
    return (ts[0] * 1e3) + (ts[1] / 1e6);
};

/**
 * create service unavailable error
 */
const createError = (message = "Service Under Pressure"): IO<HttpError> => () =>
    new HttpError(message, HttpStatus.SERVICE_UNAVAILABLE);

const getSampleInterval = (eventLoopResolution, value = 1000) => {
    return Math.max(eventLoopResolution, value)
}

/**
 * Middleware options
 */
export interface Options {
    sampleInterval?: number;
    maxEventLoopDelay?: number;
    maxHeapUsedBytes?: number;
    maxRssBytes?: number;
    customError?: IO<HttpError>;
    errorMessage?: string;
    maxEventLoopUtilization?: number;
    retryAfter?: number;
}

export const underPressure$: (o?: Options) => HttpMiddlewareEffect = (opts= {}) => {

    const resolution = 10
    const sampleInterval = getSampleInterval(resolution, opts.sampleInterval);
    const maxEventLoopDelay = opts.maxEventLoopDelay || 0
    const maxHeapUsedBytes = opts.maxHeapUsedBytes || 0
    const maxRssBytes = opts.maxRssBytes || 0
    const createUnderPressureError = opts.customError || createError(opts.errorMessage)
    const maxEventLoopUtilization = opts.maxEventLoopUtilization || 0

    const checkMaxEventLoopDelay = maxEventLoopDelay > 0
    const checkMaxHeapUsedBytes = maxHeapUsedBytes > 0
    const checkMaxRssBytes = maxRssBytes > 0
    const checkMaxEventLoopUtilization = eventLoopUtilization ? maxEventLoopUtilization > 0 : false

    let heapUsed = 0
    let rssBytes = 0
    let eventLoopDelay = 0
    let lastCheck
    let histogram
    let elu
    let eventLoopUtilized = 0

    if (monitorEventLoopDelay) {
        histogram = monitorEventLoopDelay({ resolution })
        histogram.enable()
    } else {
        lastCheck = now()
    }

    if (eventLoopUtilization) {
        elu = eventLoopUtilization()
    }

    function updateEventLoopDelay () {
        if (histogram) {
            eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution)
            histogram.reset()
        } else {
            const toCheck = now()
            eventLoopDelay = Math.max(0, toCheck - lastCheck - sampleInterval)
            lastCheck = toCheck
        }
    }

    function updateEventLoopUtilization () {
        if (elu) {
            eventLoopUtilized = eventLoopUtilization(elu).utilization
        } else {
            eventLoopUtilized = 0
        }
    }

    function updateMemoryUsage () {
        const mem = process.memoryUsage()
        heapUsed = mem.heapUsed
        rssBytes = mem.rss
        updateEventLoopDelay()
        updateEventLoopUtilization()
    }

    function memoryUsage () {
        return {
            eventLoopDelay,
            rssBytes,
            heapUsed,
            eventLoopUtilized
        }
    }

    const timer = setInterval(updateMemoryUsage, sampleInterval)
    timer.unref()

    // TODO: handle cleanup
    // register stream completion handler to stop interval

    return (req$, ctx) => {
        const logger = useContext(LoggerToken)(ctx.ask);

        return req$
            .pipe((source) => {

                // mark service as unavailable if we're under heavy pressure
                if ((checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay)
                    || (checkMaxHeapUsedBytes && heapUsed > maxHeapUsedBytes)
                    || (checkMaxRssBytes && rssBytes > maxRssBytes)
                    || (checkMaxEventLoopUtilization && eventLoopUtilized > maxEventLoopUtilization)
                ) {
                    logger({ tag: LoggerTag.HTTP, type: 'UnderPressureLogger', level: LoggerLevel.ERROR,
                        message: `System under pressure! usage stats: ${JSON.stringify(memoryUsage())}`,
                    })();

                    return source.pipe(mergeMap(() => throwError(createUnderPressureError())));
                }

                // not under pressure? keep going and simply return the request stream
                /*
                logger({ tag: LoggerTag.HTTP, type: 'UnderPressureLogger', level: LoggerLevel.DEBUG,
                    message: `System not under pressure! ${JSON.stringify(memoryUsage())}`,
                })();
               */

                return source;
            });
    };
};