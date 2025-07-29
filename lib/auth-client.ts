import { createAuthClient } from "better-auth/react"
export const authclient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKURL, 
    // the base url of your auth server
    fetchOptions: {
        onSuccess: (ctx:any) => {
            const authToken = ctx.response.headers.get("set-auth-token") // get the token from the response headers
            // Store the token securely (e.g., in localStorage)
            if(authToken){
              sessionStorage.setItem("ges_com_token", authToken);
            }
        },
        auth: {
            type:"Bearer",
            token: () => sessionStorage.getItem("ges_com_token") || "" // get the token from localStorage
         }
    }
})