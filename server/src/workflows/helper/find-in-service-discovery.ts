import {
    AppDetails,
    MicrofrontendConfiguration,
    MicrofrontendConfigurations,
    NameDetails, RuntimeDetails, ServiceDetails
} from "../../model/microfrontends";
import {parseName} from "./parse-name";

export const findConfig = (configs: MicrofrontendConfigurations) => (nameDetails: NameDetails): MicrofrontendConfiguration => {
    return configs[nameDetails.scope];
}

/**
 *
 * @param configs
 *
 * in returning function
 * @param name in form @scope/name
 */
export const findApp = (configs: MicrofrontendConfigurations) => (name: string): AppDetails => {
    const nameDetails = parseName(name);

    const config = findConfig(configs)(nameDetails);
    if (!config) throw new Error(`Unknown Scope [${nameDetails.scope}]. No microfrontends found for scope.`);

    const route = config.apps[nameDetails.name];
    if (!route) throw new Error(`Unknown Name [${nameDetails.name}]. No microfrontend app found in scope.`);

    return {
        name: nameDetails,
        route,
        config
    }
}

/**
 *
 * @param configs
 *
 * in returning function
 * @param name in form @scope/name
 */
export const findService = (configs: MicrofrontendConfigurations) => (name: string): ServiceDetails => {
    const nameDetails = parseName(name);

    const config = findConfig(configs)(nameDetails);
    if (!config) throw new Error("Unknown Name. No microfrontends found for scope.");

    const serviceUrl = config.services[nameDetails.name];
    if (!serviceUrl) throw new Error("Unknown Name. No microfrontend service found in scope.");

    return {
        name: nameDetails,
        serviceUrl,
        config
    }
}

/**
 *
 * @param configs
 *
 * in returning function
 * @param name in form @scope/name
 */
export const findRuntime = (configs: MicrofrontendConfigurations) => (name: string): RuntimeDetails => {
    const nameDetails = parseName(name);

    const config = findConfig(configs)(nameDetails);
    if (!config) throw new Error("Unknown Name. No microfrontends found for scope.");

    const runtimeUrl = config.runtimes[nameDetails.name];
    if (!runtimeUrl) throw new Error("Unknown Name. No microfrontend runtime found in scope.");

    return {
        name: nameDetails,
        runtimeUrl,
        config
    }
}