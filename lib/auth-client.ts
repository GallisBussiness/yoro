import { createAuthClient } from "better-auth/react"
export const authclient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKURL
})