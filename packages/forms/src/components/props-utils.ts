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