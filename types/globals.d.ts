export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            onboardingComplete?: boolean
            rollNo?: string
            role?: string
        }
    }
}