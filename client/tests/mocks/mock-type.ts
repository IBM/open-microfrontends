/**
 * HTML Examples for testing the mf-app web component
 */
import {InterceptMockData} from "taiko";

export interface Examples {
    [k: string]: {
        url: string,
        html: string,
        intercepts?: {[k:string]: InterceptMockData}
    }
};
