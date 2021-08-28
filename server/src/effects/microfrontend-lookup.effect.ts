import {IO} from "fp-ts/IO";
import {MicrofrontendApplicationAddress} from "../model/microfrontends";
import {notUndefined} from "../common/not-undefined";

/**
 * environment variable prefix used to define microfrontends that should be connected
 */
const mfAppPrefix = "MF_APP_";

/**
 * IO Function to read all microfrontends that should be connected from the environment.
 */
export const microfrontendLookup: IO<MicrofrontendApplicationAddress[]> = () =>
    Object.keys(process.env)
        .filter(envName => envName.startsWith(mfAppPrefix))
        .map(envName => process.env[envName])
        .filter(notUndefined);