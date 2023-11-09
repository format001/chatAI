import { defineStore } from 'pinia';
import { getToken, removeToken, setToken } from './helper';
import { store } from '@/store';
import { fetchSession } from '@/api';
export const useAuthStore = defineStore('auth-store', {
    state: () => ({
        token: getToken(),
        session: null,
    }),
    getters: {
        isChatGPTAPI(state) {
            return state.session?.model === 'ChatGPTAPI';
        },
    },
    actions: {
        async getSession() {
            try {
                const { data } = await fetchSession();
                this.session = { ...data };
                return Promise.resolve(data);
            }
            catch (error) {
                return Promise.reject(error);
            }
        },
        setToken(token) {
            this.token = token;
            setToken(token);
        },
        removeToken() {
            this.token = undefined;
            removeToken();
        },
    },
});
export function useAuthStoreWithout() {
    return useAuthStore(store);
}
