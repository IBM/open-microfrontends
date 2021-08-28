import {filterHeaders} from "../common/filter-headers";

/**
 * removes all headers that shouldn't be forwarded to the microfrontend and vice versa
 */
export const filterProxyRequestHeaders = filterHeaders([
    // unique for every connection and shouldn't be forwarded
    "connection",
    // keep alive can be different between server and microfrontend and for server and client
    "keep-alive"
]);
