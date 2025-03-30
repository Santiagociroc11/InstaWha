/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVOLUTIONAPI_URL: string
  readonly VITE_EVOLUTIONAPI_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}