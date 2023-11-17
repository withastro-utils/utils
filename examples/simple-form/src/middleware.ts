import { sequence } from "astro:middleware";
import astroForms from "@astro-utils/forms";

export const onRequest = sequence(astroForms({}));
