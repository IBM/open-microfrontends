import {Subject} from "rxjs";

/**
 * get notified exactly once
 *
 * @param subject
 * @param fn
 */
export const once = async <A>(subject: Subject<A>): Promise<A> => {
    const value = await subject.asObservable().toPromise();
    return value;
};
