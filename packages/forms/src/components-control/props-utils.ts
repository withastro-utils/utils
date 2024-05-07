/**
 * Returns the difference between two objects
 */
export function diffProps(object1: any, object2: any) {
    const diff = {};
    for (const [key, value] of Object.entries(object2)) {
        if (JSON.stringify(object1[key]) !== JSON.stringify(value)) {
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

/**
 * Omit properties from an object, any property that starts with an underscore or is in the props array will be omitted
 */
export function omitProps(object: any, props: string[] | true) {
    if (props === true) {
        return {};
    }

    const result = {...object};
    for (const prop in object) {
        if(props.includes(prop) || prop[0] === '_'){
            delete result[prop];
        }
    }
    return result;
}
