import { ss } from '@/utils/storage';
const LOCAL_NAME = 'promptStore';
export function getLocalPromptList() {
    const promptStore = ss.get(LOCAL_NAME);
    return promptStore ?? { promptList: [] };
}
export function setLocalPromptList(promptStore) {
    ss.set(LOCAL_NAME, promptStore);
}
