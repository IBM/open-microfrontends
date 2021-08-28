
// TODO: support for portal if portal is supported by browsers
// PORTAL = "portal"

/**
 * no special will be sandbox applied.
 *
 */
type SandboxNone = "none";

/**
 * load the microfrontend as iframe
 */
type SandboxIFrame = "iframe";

type SandboxValues = SandboxNone | SandboxIFrame;
