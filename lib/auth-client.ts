import { createAuthClient } from "better-auth/react"

export const authclient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKURL,
    // Activer les credentials pour les cookies cross-origin
    fetchOptions: {
        credentials: 'include',
        onError(context) {
            // Gérer les erreurs de session
            if (context.error.status === 401) {
                console.error('Session expirée ou invalide');
            }
        }
    }
})