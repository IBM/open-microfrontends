import {Transform} from "stream";
import {MicrofrontendMetadata} from "../../model/microfrontends";

export type MicrofrontendRenderer = (mfName: string, opts: object) => Promise<MicrofrontendMetadata>

/**
 * converts the given key to a dataset API compatible key,
 * convert dash-writing to camelCaseWriting:
 *  any dash (U+002D) is replaced by the capitalization of the next letter, converting the name to camelcase.
 *  source: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*
 *
 * @param key
 */
const toDatasetKey = (key: string): string => {
    let keyChars = [...key];
    let nextDashIndex = -1;
    while((nextDashIndex = keyChars.indexOf("-")) > -1) {
        // remove dash
        keyChars.splice(nextDashIndex, 1);
        // convert the char after the dash (now at the same index
        // as the dash before being removed) to upper case
        keyChars[nextDashIndex] = keyChars[nextDashIndex].toUpperCase();
    }

    return keyChars.join("");
}

export const parseMfApp = (html: string) => {
    const nameMatch = /name="([^"]*)"/.exec(html);
    if (nameMatch === null) throw new Error("No name for microfrontend found: " + html);

    const opts = {};

    const dataArgs = (html as any).matchAll(/data-([^"]*)="([^"]*)"/g)
    let match;
    while((match = dataArgs.next()).value !== undefined) {
        // ignore first array item in value as its the full matching string
        const [, key, value] = match.value;
        opts[toDatasetKey(key)] = value;
    }

    return {
        name: nameMatch[1],
        opts
    }
}

/**
 * transforms a stream with server side rendered microfrontends
 *
 * Achtung:
 *  Dadurch, dass kein streaming HTML Parser verwendet wird, kann ein Server Side Rendering
 *  nicht durchgeführt werden, wenn die öffnenden oder schlißendem mf-tags in verschiedenen Chunks im Stream übertragen werden.
 *  Sollte dies der Fall sein, greift aber der clientseitige Fallback.
 *  TODO; durch parse5 HTML Parser ersetzen um stabilere SSR funktionalität zu ermöglichen
 *
 * @param renderFn
 */
export const mfSsrTransform = (renderFn: MicrofrontendRenderer) => {
    let nextMfIndex = -1;
    let nextMfClosingIndex = -1;
    let buffer = "";

    return new Transform({
        async transform(chunk, encoding, callback) {
            let stringChunk = buffer + chunk.toString();
            buffer = "";

            while((nextMfIndex = stringChunk.indexOf("<mf-app")) > -1) {
                // push everything before our first mf to the stream
                this.push(stringChunk.substring(0, nextMfIndex));
                // safe rest of string chunk for further processing
                stringChunk = stringChunk.substring(nextMfIndex);

                // do we have the end tag in this chunk?
                if ((nextMfClosingIndex = stringChunk.indexOf("</mf-app>")) === -1) {
                    buffer += stringChunk;
                    stringChunk = "";
                    break; // break out of the loop to wait for the next chunk
                }

                // get complete mf-app markup
                const nextMf = stringChunk.substring(0, nextMfClosingIndex + 9);
                let openingMf = "";
                if ((openingMf = stringChunk.substring(0, stringChunk.indexOf(">") + 1)).indexOf("lazy") > -1) {
                    // if mf is lazy push to stream and go on with parsing
                    this.push(nextMf);
                    stringChunk = stringChunk.substring(nextMfClosingIndex + 9);
                } else {
                    // server side rendering for mf
                    try {
                        const { name, opts } = parseMfApp(nextMf);
                        const meta = await renderFn(name, opts);
                        const ssrMf = await meta.html();

                        // not the best way for loading css, but anyway... css for server side rendered microfrontends
                        // should be prevented as it cause performance problems. Loading CSS for lazy loadded microfrontends is not a problem
                        // but for ssr inline styles or css in js should be used to improve initial loading performance of the page
                        // ... this is only included to make development and transition to use this framework easier.
                        // ... approach with loading stylesheets from link tags within body is adopted from tailor.
                        meta.cssLinks.forEach(css => this.push(`<link rel="stylesheet" href="${css}">`))

                        // additional request is bad for performance, but better initial loading time if css is included in the first response.
                        // TODO: request css for linked runtime and include as link rel stylesheet as done above
                        // for now it is handled on the client side..

                        this.push(`<mf-app runtimes="${meta.runtimeLinks.join(",")}" module-src="${meta.moduleSrc}"${
                            // use opening tag execpt for the beginning <mf-app
                            openingMf.substring(7)
                        }`);
                        this.push(ssrMf);
                        this.push("</mf-app>")

                        // remove mf from chunk and continue parsing
                        stringChunk = stringChunk.substring(nextMfClosingIndex + 9);
                    } catch (e) {
                        // if we can't handle ssr, we fallback to client side rendering
                        console.error(e);
                        // render current mf-app with lazy fallback and continue with the next one
                        this.push(`<mf-app lazy="ssr-error-fallback" ${
                            // use all of the next mf-app tag except for the beginning <mf-app
                            nextMf.substring(7)
                        }`);
                        stringChunk = stringChunk.substring(nextMfClosingIndex + 9);
                    }
                }
            }

            // chunk processing done
            this.push(stringChunk);
            callback();
        }
    });
}