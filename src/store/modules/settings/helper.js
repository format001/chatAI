import { ss } from '@/utils/storage';
const LOCAL_NAME = 'settingsStorage';
export function defaultSetting() {
    return {
        systemMessage: 'You are ChatGPT, a large language model trained by OpenAI. Follow the user\'s instructions carefully. Respond using markdown.',
        temperature: 0.8,
        top_p: 1,
    };
}
export function getLocalState() {
    const localSetting = ss.get(LOCAL_NAME);
    return { ...defaultSetting(), ...localSetting };
}
export function setLocalState(setting) {
    ss.set(LOCAL_NAME, setting);
}
export function removeLocalState() {
    ss.remove(LOCAL_NAME);
}
