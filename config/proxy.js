export function createViteProxy(isOpenProxy, viteEnv) {
    if (!isOpenProxy)
        return;
    const proxy = {
        '/api': {
            target: viteEnv.VITE_APP_API_BASE_URL,
            changeOrigin: true,
            rewrite: path => path.replace('/api/', '/'),
        },
    };
    return proxy;
}
