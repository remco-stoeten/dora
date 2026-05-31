import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type TThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: TThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children as React.ReactNode}
    </NextThemesProvider>
  );
}
