import { z } from "zod";
import AboutFormName from "./about-form-name.js";

export function parseMultiNumber(about: AboutFormName) {
    const numArray = z.array(z.number());

    about.formValue = about.formValue.map(Number);
    about.catchParse(numArray);
}

export function parseMultiDate(about: AboutFormName) {
    const dateArray = z.array(z.date());

    about.formValue = about.formValue.map((date: string) => new Date(date));
    about.catchParse(dateArray);
}