/**
 * Attributes used by the MF-APP web component
 */
export const Attributes = {
    /**
     * attribute for the microfrontend name
     */
    NAME: "name",

    /**
     * source of the js module to load and run for a server side rendered microfrontend.
     */
    MODULE_SRC: "module-src",

    /**
     * array of runtimes to be loaded for a server side rendered microfrontend
     */
    RUNTIMES: "runtimes",

    /**
     * lazy attribute if the microfrontend should be loaded lazily
     *
     * - can be empty to load the mf-app right after page-load,
     *
     * - can be equals to "viewport" to defer loading until the mf-app
     *      element is scrolled near the viewport.
     *
     * - can be equals to "ssr-error-fallback" to indicate that server side rendering failed,
     *      it behaves the exact same way as the if the lazy attribute was defined without any value.
     *      Its only defined to make debugging errors easier.
     */
    LAZY: "lazy"
};