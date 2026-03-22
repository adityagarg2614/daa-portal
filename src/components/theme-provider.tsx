"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider
            {...props}
            // next-themes injects an inline script to prevent FOUC.
            // scriptProps suppresses the React 19 "script tag" console warning.
            scriptProps={{ "data-cfasync": "false" }}
        >
            {children}
        </NextThemesProvider>
    )
}