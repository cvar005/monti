"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Reads a browser-only value (storage, user agent) without a hydration mismatch: the server render uses `serverValue`. */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noop, read, () => serverValue);
}

export function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // storage blocked: the choice lasts until reload
  }
}
