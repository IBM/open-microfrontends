
export class EventFactory {
    /**
     * Event to indicate that a microfrontend will be loaded.
     *
     * Loading can be canceled by calling #preventDefault() on the event.
     */
    static newMicrofrontendWillLoadEvent() {
        return new Event("MicrofrontendWillLoad", {
            // event should bubble, so someone can build generic logic
            // with a single event handler on the body element.
            bubbles: true,
            // loading can be canceled
            cancelable: true
        });
    }

    /**
     * Event to indicate that the html part of a microfrontend is loaded.
     */
    static newMicrofrontendLoadedEvent() {
        return new Event("MicrofrontendLoaded", {
            // event should bubble, so someone can build generic logic
            // with a single event handler on the body element.
            bubbles: true,
            // mf is already loaded, so it can't be canceled
            cancelable: false
        });
    }
}