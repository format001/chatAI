import { defineStore } from 'pinia';
import { getLocalSetting, setLocalSetting } from './helper';
import { store } from '@/store';
export const useAppStore = defineStore('app-store', {
    state: () => getLocalSetting(),
    actions: {
        setSiderCollapsed(collapsed) {
            this.siderCollapsed = collapsed;
            this.recordState();
        },
        setTheme(theme) {
            this.theme = theme;
            this.recordState();
        },
        setLanguage(language) {
            if (this.language !== language) {
                this.language = language;
                this.recordState();
            }
        },
        recordState() {
            setLocalSetting(this.$state);
        },
    },
});
export function useAppStoreWithOut() {
    return useAppStore(store);
}
