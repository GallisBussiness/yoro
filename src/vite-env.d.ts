/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_BACKURL: any
    readonly VITE_APP_TITLE: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }