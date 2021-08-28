import {Attributes} from "../attributes";
import {Runtime} from "../runtime";

/**
 * updates the content of the given element
 */
export const updateContent = (element: HTMLElement) => (content: string) => {
    element.innerHTML = content;
}

/**
 * removes all the content of the given element
 */
export const removeChildren = (element: HTMLElement) => () => {
    while (element.firstChild) {
        element.removeChild(element.lastChild!);
    }
}

/**
 * updates the content of the given element
 */
export const addChildren = (element: HTMLElement) => (children: Element[]) => {
    element.append(...children);
}

/**
 * sets the module src for the given element
 */
export const setModuleSrc = (element: HTMLElement) => (moduleSrc: string) => {
    element.setAttribute(Attributes.MODULE_SRC, moduleSrc);
}

export const setRuntimeLinks = (element: HTMLElement) => (runtimeLinks: string[]) => {
    element.setAttribute(Attributes.RUNTIMES, `${runtimeLinks.join(",")}`);
}

export const applyRuntimeMapping = (runtimes: Runtime[], scope: string) => {
    const mergedRuntimeMappings = runtimes.reduce(
        (previousValue, currentValue) => Object.assign(previousValue, currentValue.imports), {});

    // import mapping based on: https://github.com/guybedford/es-module-shims
    document.body.appendChild(Object.assign(document.createElement('script'), {
        type: 'importmap-shim',
        innerHTML: JSON.stringify({ scopes: { [scope]: mergedRuntimeMappings } })
    }));
}

export const loadCss = (href: string, media = "all") => {
    console.debug("load microfrontend css: ", href);

    const linkEl = document.createElement( "link" );
    linkEl.rel = "stylesheet";
    linkEl.href = href;
    linkEl.media = media;

    // TODO:C optimize: preload href file and add afterwards as link to dom to prevent render blocking
    setTimeout(() => document.head.appendChild(linkEl), 0);
}

// read api host from global env variable if present,
// defaults to empty string. API Host can be specified
// to include microfontends in applications that doesn't
// run behind our integration server, beside specifying the
// API Host, they also need to include the javascript bundle
// in order to use the mf-app web-component.
export const getMicrofrontendApiHost = () => {
    return (<any>window).env ? (<any>window).env.MICROFRONTEND_API_HOST || "" : "";
}