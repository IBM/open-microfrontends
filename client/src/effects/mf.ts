import {MfApp} from "../mf-app";
import {
    addChildren, applyRuntimeMapping,
    getMicrofrontendApiHost,
    removeChildren,
    setModuleSrc,
    setRuntimeLinks,
    updateContent
} from "./dom";
import {Attributes} from "../attributes";
import {EventFactory} from "../events";
import {fetchMicrofrontend, loadRuntimes} from "./api";

const apiHost = getMicrofrontendApiHost();

export const bootstrapJsModule = async (el: MfApp, name: string) => {
    let moduleSrc = el.getAttribute(Attributes.MODULE_SRC);
    if (!moduleSrc) return;

    if (moduleSrc.indexOf("://") === -1 && apiHost !== "") {
        moduleSrc = apiHost + moduleSrc;
    }

    // check if we need to load runtimes before the js module gets loaded
    let runtimeDefs = el.getAttribute(Attributes.RUNTIMES);
    if (runtimeDefs) {
        const runtimes = await loadRuntimes(runtimeDefs.split(","));
        applyRuntimeMapping(runtimes, moduleSrc);
    }

    // import module and get reference to its bootstrap method
    const { bootstrap } = await import(moduleSrc);

    if(!bootstrap) {
        throw new Error(`Microfrontend [${name}] js module loaded, but has no exported #bootstrap(element) method. Bootstrapping aborted!`);
    }

    // call module with a reference to the web component
    // so it can render itself to the dom or interact with our public api
    bootstrap(el);
};

export const lazyLoadMicrofrontend = async (el: MfApp, name: string) => {
    // wait until we really should load the microfrontend
    await deferMicrofrontendLoading(el);

    // notify the world about our intention to load a microfrontend
        if(!el.dispatchEvent(EventFactory.newMicrofrontendWillLoadEvent())) {
     // someone doesn't want that we load the microfrontend => abort loading
     return;
    }

    let datasetAsJson = "{}";
    try {
        datasetAsJson = JSON.stringify(el.dataset);
    } catch (e) {
        console.error("Error converting dataset to json. Empty Dateset will be send to the microfrontend as x-mf-dataset header.")
    }

    const mfMeta = await fetchMicrofrontend(name, datasetAsJson);
    console.log("load mf content..", el.getAttribute(Attributes.LAZY), mfMeta);

    // remove content before add lazy loaded content
    // this is done so lazy loaded mfs can contain skeleton html to indicate lazy loading to the user
    removeChildren(el)();
    addChildren(el)(mfMeta.microfrontendElements);
    setModuleSrc(el)(mfMeta.moduleSrc);

    if (mfMeta.runtimeLinks && mfMeta.runtimeLinks.length > 0) {
        setRuntimeLinks(el)(mfMeta.runtimeLinks);
    }

    // notify the world about the successful loading of the microfrontend
    el.dispatchEvent(EventFactory.newMicrofrontendLoadedEvent())
}


export const deferMicrofrontendLoading = (el: MfApp): Promise<void> => {
    // loading only needs to be deferred if viewport is specified
    if(el.getAttribute(Attributes.LAZY) !== "viewport") return new Promise(r => r());

    console.log("use intersection observer... ");
    // resolve promise if the microfrontend is near the viewport
    return new Promise(r => {
        new IntersectionObserver((entries, observer) => {
            // find relevant entry
            const entry = entries.find((e) => e.target.isSameNode(el));

            // resolve if element is near viewport
            if (entry && entry.isIntersecting) {
                r();
                observer.unobserve(el);
            }
        }, {
            // to use the browser viewport
            root: null,
            // get notified if the first pixel reaches our viewport
            threshold: 0,
            // extend viewport to get notified before the viewport is reached.
            // So the mf can be loaded before the user sees it.
            rootMargin: "10px"
        }).observe(el);
    });
}

/**
 * checks if the given element needs to fallback to lazy loading,
 * due to misconfiguration or an error with server side rendering.
 *
 * @param el
 */
export const needLazyLoadingFallback = (el: MfApp): boolean => {
    // if a module src is defined, everything is alright, no fallback needed
    if(el.hasAttribute(Attributes.MODULE_SRC)) return false;

    // not every mf needs js, so everything is alright if at least some html is defined
    if (el.innerHTML.trim() !== "") return false;

    // but if no html childs are defined and no js module is specified,
    // we should try to lazy load the microfrontend
    return true;
}