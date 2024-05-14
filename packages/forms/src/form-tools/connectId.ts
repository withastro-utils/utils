import {createHash} from "node:crypto"

export function createUniqueContinuanceName(func: Function, length = 10){
    const uniqueText = func.toString() + func.name;
    return hashString(uniqueText, length);
}

export function hashString(uniqueText: string, length = 10){
    return createHash('md5').update(uniqueText).digest('hex').substring(0, length);
}