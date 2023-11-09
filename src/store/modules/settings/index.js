import { defineStore } from 'pinia';
import { defaultSetting, getLocalState, removeLocalState, setLocalState } from './helper';
export const useSettingStore = defineStore('setting-store', {
    state: () => getLocalState(),
    actions: {
        updateSetting(settings) {
            this.$state = { ...this.$state, ...settings };
            this.recordState();
        },
        resetSetting() {
            this.$state = defaultSetting();
            removeLocalState();
        },
        recordState() {
            setLocalState(this.$state);
        },
    },
});
