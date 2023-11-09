import { defineStore } from 'pinia';
import { defaultSetting, getLocalState, setLocalState } from './helper';
import {reactive} from "vue";
export const useUserStore = defineStore('user-store', {
    // state: () => getLocalState(),
    state: () => reactive(getLocalState()),
    getters: {
        getUserInfo: state => {
            return state.userInfo;
        }
    },
    actions: {
        updateUserInfo(userInfo) {
            this.$patch({
                userInfo
            })
            // this.userInfo = { ...this.userInfo, ...userInfo }
            this.recordState();
        },
        resetUserInfo() {
            this.$patch({
                userInfo: { ...defaultSetting().userInfo }
            })
            // this.userInfo = { ...defaultSetting().userInfo };
            this.recordState();
        },
        recordState() {
            setLocalState(this.$state);
        },
    },
});
