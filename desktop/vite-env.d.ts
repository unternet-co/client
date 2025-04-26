/// <reference types="vite/client" />

interface System {
  fetch: (url: string) => Promise<string>;
}

declare global {
  const system: System;
}

// This empty export makes this file a module
export {};
