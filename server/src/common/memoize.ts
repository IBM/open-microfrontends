import { IO } from "fp-ts/IO";

export function memoize<A>(ma: IO<A>): IO<A> {
    let cache: A;
    let done: boolean = false;

    return () => {
        if (!done) {
            cache = ma()
            done = true
        }

        return cache;
    }
}
