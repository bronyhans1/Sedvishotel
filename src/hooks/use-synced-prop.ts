"use client";

import { useEffect, useState } from "react";

/** Keeps client state in sync when server props refresh via router.refresh(). */
export function useSyncedProp<T>(value: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(value);

  useEffect(() => {
    setState(value);
  }, [value]);

  return [state, setState];
}
