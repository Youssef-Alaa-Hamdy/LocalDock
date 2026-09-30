"use client";

/**
 * Non-React runtime access to the active dictionary.
 *
 * Plain modules (transfer engine, API wrapper) don't have React context;
 * the provider keeps this module pointed at the active locale's dictionary
 * so they can localize messages at creation time.
 */

import type { Dictionary } from "./locales";
import { en } from "./en";

let active: Dictionary = en;

export function setActiveDictionary(dict: Dictionary) {
  active = dict;
}

export function activeDictionary(): Dictionary {
  return active;
}
