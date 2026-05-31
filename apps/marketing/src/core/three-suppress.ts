"use client";

(() => {
  const originalWarn = console.warn.bind(console);

  console.warn = (...args: any[]) => {
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      args[0].startsWith("THREE.Clock:")
    ) {
      return;
    }
    originalWarn(...args);
  };
})();

export {};
