import {IncomingHttpHeaders} from "http";

export const filterHeaders = (blacklist: string[]) => (headers: IncomingHttpHeaders): IncomingHttpHeaders => {
     return Object.keys(headers)
        .filter(h => !blacklist.includes(h))
        .reduce((acc,h) => ({ ...acc, [h]: headers[h]}), {} as IncomingHttpHeaders);
}