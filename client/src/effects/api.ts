import {getMicrofrontendApiHost, loadCss} from "./dom";
import {Runtime} from "../runtime";

const apiHost = getMicrofrontendApiHost();
const apiBasePath = apiHost + "/_mf-api";

const domParser = new DOMParser();

export interface MicrofrontendMetadata {
    moduleSrc: string,
    cssLinks: string[],
    runtimeLinks: string[],
    runtimes: Runtime[];
    microfrontendElements: Element[]
}

/**
 * return the url to load a microfrontend service as javascript module.
 * The API will return a redirect with the real URL to support versioned caching.
 * But that version is internal to the microfrontend so its not known if a service is requested.
 */
export const getServiceImportUrl = (name: string) => {
    return `${apiHost}${apiBasePath}/mf/service/${encodeURIComponent(name)}`
}

export const loadRuntimes = async (names: string[]) => {
    console.debug("load microfrontend runtimes: ", names);
    const runtimeResults = await Promise.all(names.map(n => fetch(`${apiHost}${apiBasePath}/mf/runtime/${encodeURIComponent(n)}`)));
    return await Promise.all(runtimeResults.map(result => result.json()));
}

/**
 * fetches a microfrontend with the given name
 *
 * @param name e.g. @scope/some-name
 */
export const fetchMicrofrontend = async (name: string, datasetAsJson: string): Promise<MicrofrontendMetadata> => {
    const response = await fetch(`${apiBasePath}/mf/${encodeURIComponent(name)}`, {
        headers: {
            "x-mf-dataset": datasetAsJson
        }
    });

    // fail if something went wrong
    if (!response.ok) throw new Error(`Fetching Microfrontend Failed [${name}], reason: ${response.statusText}`);

    const headers = response.headers;
    console.log("Fetch MF - Headers: ", headers, headers.get("Link"));

    let links = {
        cssLinks: [] as string[],
        moduleSrc: "",
        runtimeLinks: [] as string[],
    };

    const httpLinkHeader = headers.get("Link");
    if (httpLinkHeader) {
        links = parseLinks(httpLinkHeader);
    }

    // add css, we don't need to wait for the full body to start fetching
    // the css which are defined within the http headers
    links.cssLinks.forEach(css => {
        // append api host if no protocoll is included in the url to load
        if (css.indexOf("://") === -1) {
            css = apiHost + css;
        }

        loadCss(css)
    });

    const runtimes = await loadRuntimes(links.runtimeLinks);
    console.log("Runtimes loaded :::: ", runtimes);
    runtimes.forEach((runtime: Runtime) => {
        if (runtime.css) {
            runtime.css.forEach(href => loadCss(href));
        }
    });

    const rawHtml = await response.text();
    console.log("Fetch MF - RAW HTML: ", rawHtml);

    const doc = domParser.parseFromString(rawHtml, "text/html");
    // convert nodelist to array for further cross browser safe processing
    const microfrontendElements = [...doc.body.children]
        // ignore top level scripts from body if present,
        // this helps mf developers so they can ship an entire html page
        .filter(el => el.nodeName.toLowerCase() !== "script");

    return {
        ...links,
        runtimes,
        microfrontendElements
    };
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link
 * parse http link header for "module-src", css and runtime links
 */
export const parseLinks = (httpLinkHeader: string) => {
    const regexLinks = httpLinkHeader.split(",")
        .map(link => /<([^>]+)>;.*rel="([^"]+)".*/.exec(link))
        .filter(l => l !== null && l.length === 3); // resulting array contains complete string, and the two matching groups

    // find module-src (can only be one)
    const moduleSrcMatch = regexLinks.find(result => result![2] === "module-src");
    // use defined module src url (at index 1 / first regex group) or use empty string if nothing is defined,
    // its ok to have a microfrontend without any js
    const moduleSrc = moduleSrcMatch ? moduleSrcMatch[1] : "";

    // filter for stylesheets (multiple stylesheets can be defined)
    const cssLinks = regexLinks
        .filter(result => result![2] === "stylesheet")
        .map(match => match![1]);

    // filter for runtime links
    const runtimeLinks: string[] = regexLinks
        .filter(result => result![2] === "runtime")
        .map(match => match![1]);

    return {
        cssLinks,
        moduleSrc,
        runtimeLinks,
    };
}