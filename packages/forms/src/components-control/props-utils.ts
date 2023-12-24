/**
 * Returns the difference between two objects
 */
export function diffProps(object1: any, object2: any) {
    const diff = {};
    for (const [key, value] of Object.entries(object2)) {
        if (object1[key] !== value) {
            diff[key] = value;
        }
    }
    return diff;
}

export function getSomeProps(object: any, props: string[] | true) {
    if (props === true) {
        return object;
    }
    const result = {};
    for (const prop of props) {
        result[prop] = object[prop];
    }
    return result;
}
