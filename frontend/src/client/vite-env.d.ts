interface ImportMetaEnv {
    readonly VITE_LOCAL_ADDRESS: string;
    // ajoute ici toutes les variables que tu utilises
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }