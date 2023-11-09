import { defineStore } from 'pinia';
import { getLocalPromptList, setLocalPromptList } from './helper';
import { reactive } from 'vue'
export const usePromptStore = defineStore('prompt-store', {
    state: () => reactive(
        getLocalPromptList()
    ),
    actions: {
        updatePromptList(promptList) {
            this.$patch({ promptList });
            setLocalPromptList({ promptList });
        },
        getPromptList(state) {
            console.log('state', state, this)
            return this.$state;
        },
    },
});
