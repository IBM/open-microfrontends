/**
 * key rel and array of urls for the given type
 */
export interface RelLinks {
    [rel: string]: string[]
}

export const parseLinkByRel = (linkHeader: string): RelLinks => {
    return linkHeader.split(",")
        .map(link => /<([^>]+)>;.*rel="([^"]+)".*/.exec(link))
        .filter(l => l !== null && l.length === 3)
        .reduce((prev, current) => {
            if (!prev[current![2]]) {
                prev[current![2]] = [];
            }

            prev[current![2]].push(current![1])

            return prev;
        }, {} as RelLinks);
};

