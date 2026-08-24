"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  return [
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
    process.env.NEXT_PUBLIC_MODERATOR_PASSWORD,
  ].includes(localStorage.getItem("ADMIN_PASSWORD") || "");
}

function getServerSnapshot(): boolean {
  return false;
}

// Mirrors the cosmetic gate in components/navigation.tsx. It hides controls; it is not access control.
export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
