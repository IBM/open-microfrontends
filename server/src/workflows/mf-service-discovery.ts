import {MicrofrontendApplicationAddress, MicrofrontendConfiguration} from "../model/microfrontends";
import {of, OperatorFunction} from "rxjs";
import {mergeMap} from "rxjs/operators";
import {HttpError} from "@marblejs/core";

/**
 * Task to asynchronous fetch a configuration for a given microfrontend
 */
export type FetchApplicationConfig = (address: MicrofrontendApplicationAddress) => Promise<MicrofrontendConfiguration | HttpError>;

/**
 * return rxjs operator to run this workflow as part of a stream.
 *
 * @param fetchApps
 * @param fetchConfig
 */
export const serviceDiscoveryWorkflow = (fetchConfig: FetchApplicationConfig): OperatorFunction<MicrofrontendApplicationAddress[], MicrofrontendConfiguration | HttpError> => (source) => {
    return source
        // emit every application as single item to the stream
        .pipe(mergeMap((apps) => of<MicrofrontendApplicationAddress>(...apps)))

        // create mf config model for the given microfrontend
        .pipe(mergeMap((address) => fetchConfig(address)));
}

/**
 * return rxjs operator to run this workflow as part of a stream.
 * All configuration will be resolved in one batch and not one after another
 *
 * @param fetchApps
 * @param fetchConfig
 */
export const batchedServiceDiscoveryWorkflow = (fetchConfig: FetchApplicationConfig): OperatorFunction<MicrofrontendApplicationAddress[], (MicrofrontendConfiguration | HttpError)[]> => (source) => {
    return source
        .pipe(mergeMap(apps => Promise.all(apps.map(a => fetchConfig(a)))))
};