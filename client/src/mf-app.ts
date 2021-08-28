import {bootstrapJsModule, lazyLoadMicrofrontend, needLazyLoadingFallback} from "./effects/mf";
import {Attributes} from "./attributes";
import {getMicrofrontendApiHost} from "./effects/dom";
import {getServiceImportUrl} from "./effects/api";

/**
 * microfrontend application web component
 */
export class MfApp extends HTMLElement {

    // ! no private methods !
    // ======================
    // private modifier is removed by the typescript compiler and thus
    // all methods are public in the end. And the public methods should
    // be used by the Microfrontend Devs, so we should avoid confusing
    // them by declaring a lot of methods that shouldn't be used by them.

    /**
     * components inline style.
     * Always rendered as inline style on server side rendering as this improves initial rendering performance
     * and prevents cls (jumping content) - make sure to keep this in sync!
     */
    static shadowStyle = `
        :host {
             display: block;
             contain: content;
        }
    `;

    /**
     * components markup
     */
    static shadowDom = () => `<slot></slot>`;

    /**
     * specify the attributes we accept
     */
    static get observedAttributes() {
        return ["name", "lazy", "sandbox"];
    }

    constructor() {
        super();

        this.attachShadow({ mode: "open" });

        // verify that shadow root is defined
        if (!this.shadowRoot) throw new Error("Shadow Root must be supported to use this library. Please include a polyfill or use a modern browser.");

        // apply our minimalistic template
        this.shadowRoot.innerHTML = `<style>${MfApp.shadowStyle}</style>${MfApp.shadowDom()}`;

        const name = this.getAttribute("name");
        if (name === null) throw new Error("Every microfrontend must specify a name attribute.");


        if (getMicrofrontendApiHost() !== "") {
            console.debug(`Use special Host for all microfrontend related requests as defined in env.MICROFRONTEND_API_HOST [${getMicrofrontendApiHost()}].`)
        }

        if(!this.lazy && needLazyLoadingFallback(this)) {
            console.warn(`Fallback to lazy loading for microfrontend with name [${name}].`, this);
            this.setAttribute(Attributes.LAZY, "");
        }

        const init = async () => {
            // do lazy loading if applicable
            if (this.lazy) {
                await lazyLoadMicrofrontend(this, name)
            }

            // initialize js for server rendered and lazy loaded mfs.
            // pass this reference so mfs can interact with our API.
            if (this.hasAttribute(Attributes.MODULE_SRC)) {
                try {
                    await bootstrapJsModule(this, name);
                } catch (e) {
                    console.error(`Unable to initialize Microfrontend [${name}]. Reason:`, e);
                    throw e;
                }
            }
        };

        init().then(() => console.debug(`Microfrontend initialized and started: ${name}`));
    }

    get lazy(): boolean {
        const lazyAttr = this.getAttribute(Attributes.LAZY);
        return lazyAttr !== null && lazyAttr !== undefined;
    }

    attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
        console.log("changed", arguments);
    }

    async loadService(name: string) {
        return import(getServiceImportUrl(name));
    }
}