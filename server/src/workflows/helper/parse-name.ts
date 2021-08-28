import {NameDetails} from "../../model/microfrontends";

export const parseName = (name: string): NameDetails => {
    const scopeNameRegexResult = /\@(.*)\/(.*)/.exec(name);

    if(scopeNameRegexResult === null || scopeNameRegexResult.length !== 3) {
        throw new Error("Invalid Name Parameter received");
    }

    return {
        scope: scopeNameRegexResult[1],
        name: scopeNameRegexResult[2]
    }
}