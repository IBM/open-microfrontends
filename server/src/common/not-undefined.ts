
// based on https://github.com/microsoft/TypeScript/issues/20707
export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}