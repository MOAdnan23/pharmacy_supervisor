/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_REMOTE_AUTH?: string
  readonly VITE_USE_REMOTE_DASHBOARD?: string
  readonly VITE_USE_REMOTE_USERS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
