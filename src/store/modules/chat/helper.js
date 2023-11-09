import { ss } from '@/utils/storage';
const LOCAL_NAME = 'chatStorage';
export function defaultState() {
    const uuid = 1002;
    return {
        active: uuid,
        usingContext: true,
        history: [{ uuid, title: 'New Chat', isEdit: false }],
        chat: [{ uuid, data: [] }],
    };
}
export function getLocalState() {
    const localState = ss.get(LOCAL_NAME);
    return { ...defaultState(), ...localState };
}
export function setLocalState(state) {
    ss.set(LOCAL_NAME, state);
}
