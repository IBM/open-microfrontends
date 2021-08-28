import {injectClientFrameworkTransform, ScriptLoadingStrategy} from "./transforms/inject-client-framework-transform";
import {mfSsrTransform, MicrofrontendRenderer} from "./transforms/microfrontend-server-side-rendering-transform";
import {Readable} from "stream";
import {MicrofrontendConfigurations, MicrofrontendRequest} from "../model/microfrontends";
import {BehaviorSubject} from "rxjs";
import {findApp} from "./helper/find-in-service-discovery";
import {readText} from "../common/read-text";
import {parseLinkByRel} from "./helper/parse-links";

const SCRIPT_PATH = "/_mf-api/assets/main.umd.js";

export const renderMicrofrontend = (configs: MicrofrontendConfigurations, fetchMicrofrontend: (a: string) => MicrofrontendRequest): MicrofrontendRenderer => async (name, opts) => {
    const appDetails = findApp(configs)(name);

    const response = await fetchMicrofrontend(appDetails.config.address)(appDetails.route, "GET", {
        "x-mf-dataset": JSON.stringify(opts)
    });

    const linkHeader: string = response.headers["link"] as string | undefined || "";
    const relLinks = parseLinkByRel(linkHeader);

    // a microfrontend app can only have one module-src, so we're using the first one in case multiple sources are defined.
    // in case nothing is defined we fallback to an empty string. This gives our client side implementation
    // the information that ssr was successful but no module-src exist.
    const moduleSrc = (relLinks["module-src"] || []).shift() || "";

    return {
        moduleSrc: moduleSrc,
        cssLinks: relLinks["stylesheet"] || [],
        runtimeLinks: relLinks["runtime"] || [],
        html: async () => await readText(response.body)
    }
}

export const ssrWorkflow = (configs: BehaviorSubject<MicrofrontendConfigurations>, fetchMicrofrontend: (a: string) => MicrofrontendRequest) => (rootPageBody: Readable): Readable => {
    return rootPageBody
        // inject our main script to html head, so lazy loading and mf script execution is possible on the client side
        .pipe(injectClientFrameworkTransform(SCRIPT_PATH, ScriptLoadingStrategy.DEFER))

        // check stream for microfrontends which should be rendered on the server side
        .pipe(mfSsrTransform(renderMicrofrontend(configs.getValue(), fetchMicrofrontend)));
}
    