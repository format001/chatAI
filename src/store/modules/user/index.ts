import { defineStore } from 'pinia'
import type { UserInfo, UserState } from './helper'
import { defaultSetting, getLocalState, setLocalState } from './helper'

export const useUserStore = defineStore('user-store', {
  state: (): UserState => getLocalState(),
  getters: {
    getUserInfo: state => {

      return state.userInfo;
    }
  },
  actions: {
    updateUserInfo(userInfo: Partial<UserInfo>) {
      this.$patch({
        userInfo
      })
      // this.userInfo = { ...this.userInfo, ...userInfo }
      this.recordState()
    },

    resetUserInfo() {
      this.userInfo = { ...defaultSetting().userInfo }
      this.recordState()
    },

    recordState() {
      setLocalState(this.$state)
    },
  },
})
