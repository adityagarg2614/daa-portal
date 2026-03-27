'use client'

import { ClerkProvider } from "@clerk/nextjs"
import React from "react"
import { ThemeProvider } from "./theme-provider"
import { Toaster } from "sonner"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        </ClerkProvider>
    )
}
