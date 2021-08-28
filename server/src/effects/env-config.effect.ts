import {IO} from "fp-ts/IO";
import {Option, fromNullable, getOrElse} from "fp-ts/Option";
import {memoize} from "../common/memoize";
import {pipe} from "fp-ts/function";

// env effects handle all reading of environment variables, so it es encapsulated from our core

/**
 * read env config (but only once)
 *
 * @param key - env variable to read.
 *
 * @see envConfigEither
 */
export const envConfig: (envKey: string) => IO<Option<string>> = (envKey) => memoize<Option<string>>(() => {
    return fromNullable(process.env[envKey])
});

/**
 * read env config with fallback value in case it is not defined.
 *
 * @param envKey
 * @param onNone
 *
 * @see envConfig
 */
export const envConfigEither: (envKey: string, onNone: string) => IO<string> = (envKey, onNone) =>
    () => pipe(envConfig(envKey)(), getOrElse(() => onNone));

/**
 * read env config using #envConfigEither and converts the value to an int
 * @param envKey
 * @param onNone
 *
 * @see envConfigEither
 */
export const envConfigEitherAsInt: (envKey: string, onNone: number) => IO<number> = (envKey, onNone) => () => pipe(
    envConfigEither(envKey, onNone + "")(),
    val => {
        const parsedValue = parseInt(val);
        return parsedValue === NaN ? onNone : parsedValue;
    }
);

/**
 * read env config using #envConfigEither and converts the value to a float
 * @param envKey
 * @param onNone
 *
 * @see envConfigEither
 */
export const envConfigEitherAsFloat: (envKey: string, onNone: number) => IO<number> = (envKey, onNone) => () => pipe(
    envConfigEither(envKey, onNone + "")(),
    val => {
        const parsedValue = parseFloat(val);
        return parsedValue === NaN ? onNone : parsedValue;
    }
);