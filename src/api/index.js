import { post } from '@/utils/request';
import { useAuthStore, useSettingStore } from '@/store';
export function fetchChatAPI(prompt, options, signal) {
    return post({
        url: '/chat',
        data: { prompt, options },
        signal,
    });
}
export function fetchChatConfig() {
    return post({
        url: '/config',
    });
}
export function fetchChatAPIProcess(params) {
    const settingStore = useSettingStore();
    const authStore = useAuthStore();
    let data = {
        prompt: params.prompt,
        options: params.options,
    };
    if (authStore.isChatGPTAPI) {
        data = {
            ...data,
            systemMessage: settingStore.systemMessage,
            temperature: settingStore.temperature,
            top_p: settingStore.top_p,
        };
    }
    //console.log("@@@@@@",data)
    data.k8 = params.k8;

    return post({
        url: '/chat-process',
        data,
        signal: params.signal,
        onDownloadProgress: params.onDownloadProgress,
    });
}
export function fetchSession() {
    return post({
        url: '/session',
    });
}
export function fetchVerify(token) {
    return post({
        url: '/verify',
        data: { token },
    });
}
