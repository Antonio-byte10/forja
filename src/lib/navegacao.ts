import { router, type Href } from 'expo-router';

/** Volta para a tela anterior; aberta direto (link, recarga na web), vai para `fallback`. */
export const voltar = (fallback: Href = '/') => (router.canGoBack() ? router.back() : router.replace(fallback));
