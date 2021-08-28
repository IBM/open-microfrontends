import {Transform} from "stream";

export enum ScriptLoadingStrategy {
    ASYNC,
    DEFER
}

export const injectClientFrameworkTransform = (scriptPath: string, loadingStrategy: ScriptLoadingStrategy) => {
    // TODO bundle script with library
    const frameworkScript = `<script defer src="/_mf-api/assets/es-module-shims.js"></script><script src="${scriptPath}" ${loadingStrategy === ScriptLoadingStrategy.ASYNC ? "async" : "defer"} type="module-shim"></script>`;
    const frameworkStyle = "<style>mf-app{display:block;contain: content;}</style>"
    let frameworkInserted = false;
    let headIndex = -1;

    return new Transform({
        transform(chunk, encoding, callback) {
            let stringChunk = chunk.toString();

            if (!frameworkInserted && (headIndex = stringChunk.indexOf("<head>")) > -1) {
               stringChunk =
                   // head index + 6 to include the <head> (6 chars) in the substring
                   stringChunk.substr(0, headIndex + 6)
                   // append inline style for our web component to improve initial rendering time
                   + frameworkStyle
                   // append script tag
                   + frameworkScript
                   // and add the rest of the chunk
                   + stringChunk.substr(headIndex + 6);

               // once included prevent indexOf checks to improve performance
                frameworkInserted = true;
            }

            this.push(stringChunk);
            callback();
        }
    });
};