import {envConfig, envConfigEither, envConfigEitherAsFloat, envConfigEitherAsInt} from "./env-config.effect";
import {IO} from "fp-ts/IO";
import {getOrElse, Option} from "fp-ts/Option";
import {pipe} from "fp-ts/function";


test('read env variable once', () => {
    const fooEnv: IO<Option<string>> = envConfig("Foo");

    process.env.Foo = "Foo";
    expect(pipe(fooEnv(), getOrElse(() => "Env Foo not defined"))).toBe("Foo");

    process.env.Foo = "Bar";
    // env variable is only read once so it should return the old value
    expect(pipe(fooEnv(), getOrElse(() => "Env Foo not defined"))).toBe("Foo");
});

test('read nullable env variable once', () => {
    const fooEnv: IO<Option<string>> = envConfig("Foo");

    delete process.env.Foo;
    expect(pipe(fooEnv(), getOrElse(() => "Env Foo not defined"))).toBe("Env Foo not defined");

    process.env.Foo = "Test Test";
    // env variable is only read once so it should return the old value
    expect(pipe(fooEnv(), getOrElse(() => "Env Foo not defined"))).toBe("Env Foo not defined");
});


test('read nullable env with fallback value', () => {
    const fooEnv: IO<string> = envConfigEither("Foo", "Fallback Value");

    delete process.env.Foo;
    expect(fooEnv()).toBe("Fallback Value");

    process.env.Foo = "Test Test";
    expect(fooEnv()).toBe("Test Test");

    delete process.env.Foo;
    expect(fooEnv()).toBe("Fallback Value");

    process.env.Foo = "123";
    expect(fooEnv()).toBe("123");
});

test('read env with int fallback value', () => {
    const fooEnv: IO<number> = envConfigEitherAsInt("FooINT", 300);

    delete process.env.FooINT;
    expect(fooEnv()).toBe(300);

    process.env.FooINT = "500";
    expect(fooEnv()).toBe(500);

    delete process.env.FooINT;
    expect(fooEnv()).toBe(300);

    process.env.FooINT = "123";
    expect(fooEnv()).toBe(123);
});
test('read env with float fallback value', () => {
    const fooEnv: IO<number> = envConfigEitherAsFloat("FooFloat", 0.98);

    delete process.env.FooFloat;
    expect(fooEnv()).toBe(0.98);

    process.env.FooFloat = "0.12";
    expect(fooEnv()).toBe(0.12);

    delete process.env.FooFloat;
    expect(fooEnv()).toBe(0.98);

    process.env.FooFloat = "123";
    expect(fooEnv()).toBe(123);
});
