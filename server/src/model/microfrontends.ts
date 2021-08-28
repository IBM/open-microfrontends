import * as t from 'io-ts';
import {IncomingHttpHeaders} from "http";
import {Readable} from "stream";
import {Client} from "undici";

// TODO:
// io-ts typ definieren für eine Liste mit (möglichen) Microfrontends

// TODO:
// io-ts typ definieren für eine Konfiguration eines Microfrontends

/**
 * Address used to connect a microfrontend application.
 * Should consist of protocol, host and port
 */
export const MicrofrontendApplicationAddress = t.string;
export type MicrofrontendApplicationAddress = t.TypeOf<typeof MicrofrontendApplicationAddress>;

export const MicrofrontendConfiguration = t.type({
    /**
     * address for internal use only, is not defined by the microfrontend config itself
     */
    address: MicrofrontendApplicationAddress,

    /**
     * name / scope from this microfrontend
     */
    scope: t.string,

    /**
     * All routes that should be handled as root requests by the microfrontend.
     */
    routes: t.array(t.string),

    /**
     * mapping from app name to url to load the app
     */
    apps: t.record(t.string, t.string),

    /**
     * mapping from service name to url to load the service
     */
    services: t.record(t.string, t.string),

    /**
     * mapping from runtime name to url to load the runtime
     */
    runtimes: t.record(t.string, t.string)
});
export type MicrofrontendConfiguration = t.TypeOf<typeof MicrofrontendConfiguration>;


export type MicrofrontendConfigurations = {
    [scope: string]: MicrofrontendConfiguration
}

export interface MicrofrontendMetadata {
    moduleSrc: string,
    cssLinks: string[],
    runtimeLinks: string[],
    html: () => Promise<string>
}

/**
 * details for a app or runtime or service,
 * can be parsed from the unified presentation, e,g @scope/name
 */
export interface NameDetails {
    scope: string;
    name: string;
}

export interface AppDetails {

    /**
     * name details for this app
     */
    name: NameDetails;

    /**
     * route for this app
     */
    route: string;

    /**
     * associated config for this app
     */
    config: MicrofrontendConfiguration;
}

export interface ServiceDetails {

    /**
     * name details for this service
     */
    name: NameDetails;

    /**
     * url for this service
     */
    serviceUrl: string;

    /**
     * associated config for this service
     */
    config: MicrofrontendConfiguration;
}

export interface RuntimeDetails {

    /**
     * name details for this runtime
     */
    name: NameDetails;

    /**
     * url for this runtime
     */
    runtimeUrl: string;

    /**
     * associated config for this runtime
     */
    config: MicrofrontendConfiguration;
}



export type MicrofrontendRequest = (path: string, method: string, headers?: IncomingHttpHeaders, body?: string | Buffer | Uint8Array | Readable | null) => Promise<Client.ResponseData>;