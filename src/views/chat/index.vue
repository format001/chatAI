<script setup lang='ts'>
import type {Ref} from 'vue'
import {
	computed,
	defineAsyncComponent,
	onMounted, onUnmounted, reactive, ref, toRefs, watch
} from 'vue'
import {useRoute} from 'vue-router'
import {NAutoComplete, NButton, NInput, NModal, NCard, useDialog, useMessage} from 'naive-ui'
import html2canvas from 'html2canvas'
import {Message} from './components'
import {useScroll} from './hooks/useScroll'
import {useChat} from './hooks/useChat'
import {useCopyCode} from './hooks/useCopyCode'
import {useUsingContext} from './hooks/useUsingContext'
import HeaderComponent from './components/Header/index.vue'
import {HoverButton, SvgIcon} from '@/components/common'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {useChatStore, useUserStore} from '@/store'
import {fetchChatAPIProcess} from '@/api'
import {t} from '@/locales'
import {httpPost} from "@/utils/request/service";

const LoginComponent = defineAsyncComponent(() => import(/* webpackChunkName: "LoginComponent" */ '@/components/Login/Index.vue')),
			 GuideComponent = defineAsyncComponent(() => import(/* webpackChunkName: "GuideComponent" */ '@/components/Guide/index.vue')),
			 PromptStore = defineAsyncComponent(() => { return import(/* webpackChunkName: "PromptStore" */ '@/components/common/PromptStore/index.vue')}),
		 		Setting2 = defineAsyncComponent(() => import(/* webpackChunkName: "Setting2" */ '@/components/common/Setting/index2.vue'));

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

	let controller = new AbortController()

const dialog = useDialog()
const ms = useMessage()
const chatStore = useChatStore()
const useUser = useUserStore();


const {isMobile} = useBasicLayout()
const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} = useChat()
const {scrollRef, scrollToBottom, scrollToBottomIfAtBottom} = useScroll()
const {usingContext, toggleUsingContext} = useUsingContext()

const { uuid } = useRoute().params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions)))


// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
    if (item.loading)
        updateChatSome(+uuid, index, {loading: false})
})


    let {
				modalState,
        loginModal,
				promptStoreModal,
				promptTemplate,
				inputRef,
				loading,
				prompt,
			component
        } = toRefs(reactive({
			component: null,
						modalState: undefined,
            loginModal: false,
						promptStoreModal: false,
						promptTemplate: [],
						inputRef: null,
						loading: false,
						prompt: ''
        })
    )

	watch(modalState, (newValue, oldValue) => {
		switch (newValue) {
			case "login":
				component.value = LoginComponent;
				break;
			case "guide":
				component.value = GuideComponent;
				break;
			case "promptStore":
				component.value = PromptStore;
				break;
			case "setting2":
				component.value = Setting2;
				break;
			default:
				component.value = null;
				break;
		}
	})

		function setModalState (payload) {
			modalState.value = payload;
		}

    onMounted(() => {
        const token = localStorage.getItem("user_token");
            useCopyCode()

        if (token == '' || token == null || token == 'undefined') {
						setModalState('login')
            localStorage.clear()
            useUser.resetUserInfo()
        }else{
            is_login();
        }

        scrollToBottom()
        if (inputRef.value && !isMobile.value)
            inputRef.value?.focus()
    })


//登录拦截
    async function handleSubmit() {
        let { k8 } = await is_login();
            onConversation(k8);
    }

		//重新生成
		async function handleRegenerate(index: number) {
				let { k8 } = await is_login();
				onRegenerate(index, k8);
				useUser.updateUserInfo(k8)
		}

	async function onConversation(k8: string) {
			let message = prompt.value

			if (loading.value)
					return

			if (!message || message.trim() === '')
					return

			controller = new AbortController()

			addChat(
					+uuid,
					{
							dateTime: new Date().toLocaleString(),
							text: message,
							inversion: true,
							error: false,
							conversationOptions: null,
							requestOptions: {prompt: message, options: null},
					},
			)

			scrollToBottom()

			loading.value = true
			prompt.value = ''

			let options: Chat.ConversationRequest = {}
			const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

			if (lastContext && usingContext.value)
					options = {...lastContext}

			addChat(
					+uuid,
					{
							dateTime: new Date().toLocaleString(),
							text: '',
							loading: true,
							inversion: false,
							error: false,
							conversationOptions: null,
							requestOptions: {prompt: message, options: {...options}},
					},
			)
			scrollToBottom()


			try {
					let lastText = ''
					const fetchChatAPIOnce = async () => {
							await fetchChatAPIProcess<Chat.ConversationResponse>({
									k8: k8,
									prompt: message,
									options,
									signal: controller.signal,
									onDownloadProgress: ({event}) => {
											const xhr = event.target
											const {responseText} = xhr
											// Always process the final line
											const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
											let chunk = responseText
											if (lastIndex !== -1)
													chunk = responseText.substring(lastIndex)
											try {
													const data = JSON.parse(chunk)

													updateChat(
															+uuid,
															dataSources.value.length - 1,
															{
																	dateTime: new Date().toLocaleString(),
																	text: lastText + (data.text ?? ''),
																	inversion: false,
																	error: false,
																	loading: true,
																	conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
																	requestOptions: {prompt: message, options: {...options}},
															},
													)

													if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
															options.parentMessageId = data.id
															lastText = data.text
															message = ''
															return fetchChatAPIOnce()
													}

													scrollToBottomIfAtBottom()
											} catch (error) {
													//
											}
									},
							})
							updateChatSome(+uuid, dataSources.value.length - 1, {loading: false})
					}

					await fetchChatAPIOnce()
			} catch (error: any) {
					const errorMessage = error?.message ?? t('common.wrong')

					if (error.message === 'canceled') {
							updateChatSome(
									+uuid,
									dataSources.value.length - 1,
									{
											loading: false,
									},
							)
							scrollToBottomIfAtBottom()
							return
					}

					const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

					if (currentChat?.text && currentChat.text !== '') {
							updateChatSome(
									+uuid,
									dataSources.value.length - 1,
									{
											text: `${currentChat.text}\n[${errorMessage}]`,
											error: false,
											loading: false,
									},
							)
							return
					}

					updateChat(
							+uuid,
							dataSources.value.length - 1,
							{
									dateTime: new Date().toLocaleString(),
									text: errorMessage,
									inversion: false,
									error: true,
									loading: false,
									conversationOptions: null,
									requestOptions: {prompt: message, options: {...options}},
							},
					)
					scrollToBottomIfAtBottom()
			} finally {
					loading.value = false
			}
	}

	async function onRegenerate(index: number, k8: string) {
			if (loading.value)
					return

			controller = new AbortController()

			const {requestOptions} = dataSources.value[index]

			let message = requestOptions?.prompt ?? ''

			let options: Chat.ConversationRequest = {}

			if (requestOptions.options)
					options = {...requestOptions.options}

			loading.value = true

			updateChat(
					+uuid,
					index,
					{
							dateTime: new Date().toLocaleString(),
							text: '',
							inversion: false,
							error: false,
							loading: true,
							conversationOptions: null,
							requestOptions: {prompt: message, options: {...options}},
					},
			)

			try {
					let lastText = ''
					const fetchChatAPIOnce = async () => {
							await fetchChatAPIProcess<Chat.ConversationResponse>({
									k8: k8,
									prompt: message,
									options,
									signal: controller.signal,
									onDownloadProgress: ({event}) => {
											const xhr = event.target
											const {responseText} = xhr
											// Always process the final line
											const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
											let chunk = responseText
											if (lastIndex !== -1)
													chunk = responseText.substring(lastIndex)
											try {
													const data = JSON.parse(chunk)
													updateChat(
															+uuid,
															index,
															{
																	dateTime: new Date().toLocaleString(),
																	text: lastText + (data.text ?? ''),
																	inversion: false,
																	error: false,
																	loading: true,
																	conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
																	requestOptions: {prompt: message, options: {...options}},
															},
													)

													if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
															options.parentMessageId = data.id
															lastText = data.text
															message = ''
															return fetchChatAPIOnce()
													}
											} catch (error) {
													//
											}
									},
							})
							updateChatSome(+uuid, index, {loading: false})
					}
					await fetchChatAPIOnce()
			} catch (error: any) {
					if (error.message === 'canceled') {
							updateChatSome(
									+uuid,
									index,
									{
											loading: false,
									},
							)
							return
					}

					const errorMessage = error?.message ?? t('common.wrong')

					updateChat(
							+uuid,
							index,
							{
									dateTime: new Date().toLocaleString(),
									text: errorMessage,
									inversion: false,
									error: true,
									loading: false,
									conversationOptions: null,
									requestOptions: {prompt: message, options: {...options}},
							},
					)
			} finally {
					loading.value = false
			}
	}

	function handleExport() {
		promptStoreModal.value = true;
	}

	function handleDelete(index: number) {
			if (loading.value)
					return

			dialog.warning({
					title: t('chat.deleteMessage'),
					content: t('chat.deleteMessageConfirm'),
					positiveText: t('common.yes'),
					negativeText: t('common.no'),
					onPositiveClick: () => {
							chatStore.deleteChatByUuid(+uuid, index)
					},
			})
	}

    async function handleClear() {
        if (loading.value)
            return

        const http_config = {
            headers: {'Authorization': 'Bearer ' + localStorage.getItem("user_token")}
        };

        const skillDate = await httpPost('/api/user/skill', {
            "accout_type": 1
        }, http_config);
        promptTemplate.value = skillDate.data || [];

        //检查是否有缓存
        if(promptTemplate.value === '' ||  promptTemplate.value.length <= 0){
            handleExport()
            return false;
        }
        prompt.value="@"
        inputRef.value?.focus()
    }

	function handleEnter(event: KeyboardEvent) {
			if (!isMobile.value) {
					if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault()
							handleSubmit()
					}
			} else {
					if (event.key === 'Enter' && event.ctrlKey) {
							event.preventDefault()
							handleSubmit()
					}
			}
	}

	function handleStop() {
    if (loading.value) {
        controller.abort()
        loading.value = false
    }
}

	// 可优化部分
	// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
	// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
	const searchOptions = computed( () => {
			if (prompt.value.startsWith('@')) {
					return promptTemplate.value.filter((item: {
							key: string
					}) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
							return {
									label: obj.value,
									value: obj.value,
							}
					})
			} else {
					return []
			}
	})

	// value反渲染key
	const renderOption = (option: { label: string }) => {
			for (const i of promptTemplate.value) {
					if (i.value === option.label)
							return [i.key]
			}
			return []
	}

	const placeholder = computed(() => {
			if (isMobile.value)
					return t('chat.placeholderMobile')
			return t('chat.placeholder')
	})

	const buttonDisabled = computed(() => {
			return loading.value || !prompt.value || prompt.value.trim() === ''
	})

	const footerClass = computed(() => {
			let classes = ['p-4']
			if (isMobile.value)
					classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
			return classes

	})
	const user_fx_url_cilic = () => {

	}

    /**
     * 检查是否登录
     */
   async function is_login () {
        const http_config = {
            headers: {'Authorization': 'Bearer ' + localStorage.getItem("user_token")}
        };

        let userVerifyDate = await httpPost('/api/user/user_verify', {
                                "accout_type": 1,
                                'message': prompt.value
                            }, http_config, ms);

        if (userVerifyDate.data.is_expire === 1) {
						useUser.updateUserInfo(userVerifyDate.data)
            return userVerifyDate.data
        } else {
            ms.error('账号已过期！')
						setModalState('login')
            loginModal.value = true;
        }
				return Promise.reject()
    }

	function tg(){
			if(!localStorage.getItem('user_token')){
				setModalState('login')
			}else{
				setModalState('setting2')
			}
	}


	onUnmounted(() => {
			if (loading.value)
					controller.abort()
	})
</script>

<template>
    <div class="flex flex-col w-full h-full">
			<keep-alive>
				<component
					:is="component"
					@setModalState="setModalState"
				/>
			</keep-alive>


			<HeaderComponent
            v-if="isMobile"
            :using-context="usingContext"
            @export="setModalState('promptStore')"
            @toggle-using-context="toggleUsingContext"
            @tg="tg"
        />
			<main class="flex-1 overflow-hidden">
					<div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
							<div
									id="image-wrapper"
									class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
									:class="[isMobile ? 'p-2' : 'p-4']"
							>
									<div v-if="!dataSources.length"
														@click="setModalState('guide')"
												style="color:#666;
												cursor:pointer;
													">
											<div
												class="flex items-center justify-center mt-6 text-center text-neutral-300 text-[#4f555e]">
													<SvgIcon icon="mingcute:finger-press-line" class="mr-2 mt-6 text-4xl  text-[#4f555e]" />
											</div>
											<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
													<span 	style="color:#666;">新手引导助手</span>
											</div>
									</div>
									<template v-else>
											<div @click="user_fx_url_cilic">
													<Message
															v-for="(item, index) of dataSources"
															:key="index"
															:date-time="item.dateTime"
															:text="item.text"
															:inversion="item.inversion"
															:error="item.error"
															:loading="item.loading"
															@regenerate="handleRegenerate(index)"
															@delete="handleDelete(index)"

													/>
													<div class="sticky bottom-0 left-0 flex justify-center">
															<NButton v-if="loading" type="warning" @click="handleStop">
																	<template #icon>
																			<SvgIcon icon="ri:stop-circle-line"/>
																	</template>
																	Stop Responding
															</NButton>
													</div>
											</div>
									</template>
							</div>
					</div>
			</main>
			<footer :class="footerClass">
					<div class="w-full max-w-screen-xl m-auto">
							<div class="flex items-center justify-between space-x-2">
									<HoverButton @click="handleClear">
										<span class="text-xl text-[#4f555e] dark:text-white">
											<SvgIcon icon="vaadin:at"/>
										</span>
									</HoverButton>
									<HoverButton v-if="!isMobile" @click="setModalState('promptStore')">
										<span class="text-xl text-[#4f555e] dark:text-white">
											 <SvgIcon icon="mdi:chat-plus-outline"/>
										</span>
									</HoverButton>
									<HoverButton v-if="!isMobile" @click="tg">
										<span class="text-xl text-[#4f555e] dark:text-white" >
											<SvgIcon icon="octicon:people-16"/>
										</span>
									</HoverButton>


									<!--					<HoverButton v-if="!isMobile" @click="toggleUsingContext">
									<span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
										<SvgIcon icon="ri:chat-history-line"/>
									</span>
													</HoverButton>-->
									<NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
											<template #default="{ handleInput, handleBlur, handleFocus }">
													<NInput
															ref="inputRef"
															v-model:value="prompt"
															type="textarea"
															:placeholder="placeholder"
															:autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
															@input="handleInput"
															@focus="handleFocus"
															@blur="handleBlur"
															@keypress="handleEnter"
													/>
											</template>
									</NAutoComplete>
									<NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
											<template #icon>
												<span class="dark:text-black">
													<SvgIcon icon="ri:send-plane-fill"/>
												</span>
											</template>
									</NButton>
							</div>
					</div>
			</footer>
    </div>

</template>
















<!--<script setup lang='ts'>-->
<!--import type {Ref} from 'vue'-->
<!--import {computed, onMounted, onUnmounted, ref} from 'vue'-->
<!--import {useRoute} from 'vue-router'-->
<!--import {storeToRefs} from 'pinia'-->
<!--import {NAutoComplete, NButton, NInput, NModal, NCard, useDialog, useMessage} from 'naive-ui'-->
<!--import html2canvas from 'html2canvas'-->
<!--import {Message} from './components'-->
<!--import {useScroll} from './hooks/useScroll'-->
<!--import {useChat} from './hooks/useChat'-->
<!--import {useCopyCode} from './hooks/useCopyCode'-->
<!--import {useUsingContext} from './hooks/useUsingContext'-->
<!--import HeaderComponent from './components/Header/index.vue'-->
<!--import {HoverButton, SvgIcon} from '@/components/common'-->
<!--import {useBasicLayout} from '@/hooks/useBasicLayout'-->
<!--import {useChatStore, usePromptStore, useUserStore} from '@/store'-->
<!--import Setting from '@/components/common/Setting/index.vue'-->
<!--import Setting2 from '@/components/common/Setting/index2.vue'-->
<!--import {fetchChatAPIProcess} from '@/api'-->
<!--import {t} from '@/locales'-->

<!--import { PromptStore } from '@/components/common'-->

<!--import axios from "axios";-->
<!--const show = ref(false)-->
<!--let controller = new AbortController()-->

<!--const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'-->

<!--const route = useRoute()-->
<!--const dialog = useDialog()-->
<!--const ms = useMessage()-->

<!--const chatStore = useChatStore()-->
<!--const useUser = useUserStore();-->

<!--useCopyCode()-->

<!--const {isMobile} = useBasicLayout()-->
<!--const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} = useChat()-->
<!--const {scrollRef, scrollToBottom, scrollToBottomIfAtBottom} = useScroll()-->
<!--const {usingContext, toggleUsingContext} = useUsingContext()-->

<!--const {uuid} = route.params as { uuid: string }-->

<!--const dataSources = computed(() => chatStore.getChatByUuid(+uuid))-->
<!--const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions)))-->

<!--const prompt = ref<string>('')-->
<!--const loading = ref<boolean>(false)-->
<!--const inputRef = ref<Ref | null>(null)-->


<!--const showStore= ref<boolean>(false);-->
<!--// 添加PromptStore-->
<!--const promptStore = usePromptStore()-->

<!--// 使用storeToRefs，保证store修改后，联想部分能够重新渲染-->
<!--const {promptList: promptTemplate} = storeToRefs<any>(promptStore)-->


<!--// 未知原因刷新页面，loading 状态不会重置，手动重置-->
<!--dataSources.value.forEach((item, index) => {-->
<!--	if (item.loading)-->
<!--		updateChatSome(+uuid, index, {loading: false})-->
<!--})-->

<!--//获取请求地址-->
<!--const VITE_APP_API = import.meta.env.VITE_APP_API;-->

<!--const loginModal = ref(false);-->
<!--const loginModal2 =ref(false);-->

<!--const loginModal3 =ref(false);-->

<!--const ModalShow2=ref(false);-->
<!--const vimgs=ref('https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_4.jpg');-->
<!--const vimgs2=ref(1);-->

<!--const chatout_img =()=>{-->
<!--    if(vimgs2.value ==1){-->
<!--        vimgs.value='https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_1.jpg';-->
<!--        vimgs2.value=2;-->
<!--    }else if(vimgs2.value ==2){-->
<!--         vimgs.value='https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_2.jpg';-->
<!--         vimgs2.value=3;-->
<!--    }else if(vimgs2.value ==3){-->
<!--         vimgs.value='https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_3.jpg';-->
<!--         vimgs2.value=4;-->
<!--    }else if(vimgs2.value ==4){-->
<!--         vimgs.value='https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_5.jpg';-->
<!--         vimgs2.value=5;-->
<!--    }else if(vimgs2.value ==5){-->
<!--          vimgs2.value=6;-->
<!--           loginModal3.value=false;-->


<!--         if(zfb_name.value){-->
<!--               ModalShow2.value=true;-->
<!--         } else{-->
<!--               showModal.value=true;-->
<!--         }-->
<!--    }-->
<!--}-->

<!--const yingdao=()=>{-->
<!--    vimgs2.value = 1-->
<!--      vimgs.value = 'https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/0920_4.jpg';-->
<!--     loginModal3.value = true;-->
<!--}-->
<!--const modifyModal = ref(false);-->

<!--const formValue = ref({-->
<!--	phone: "",-->
<!--	password: ''-->
<!--})-->
<!--const formValue2 = ref({-->
<!--	oldpassword: '',-->
<!--	newpassword:'',-->
<!--	password:'',-->
<!--})-->

<!--const formValue3 = ref({-->
<!--	phone: "",-->
<!--	password: '',-->
<!--	code:''-->
<!--})-->

<!--const user_code=ref('获取验证码')-->
<!--const user_code_show=ref(1)-->


<!--const re =()=>{-->
<!--    loginModal2.value=true-->
<!--}-->


<!--const handleValidateButtonClick = () => {-->

<!--	axios.post(VITE_APP_API + '/api/login', {-->
<!--		"accout_type": 1,-->
<!--		'phone': formValue.value.phone,-->
<!--		'password': formValue.value.password-->
<!--	}).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				localStorage.setItem('user_token', data.data.token)-->
<!--				localStorage.setItem('userInfo', data.data.user);-->
<!--				let dataUser = data.data.user;-->
<!--				let { cus_url } = data.data.admin;-->

<!--				let user = {-->
<!--					accout_type: dataUser.accout_type,-->
<!--					customer_id: dataUser.customer_id,-->
<!--					nickname: dataUser.nickname,-->
<!--					phone: dataUser.phone,-->
<!--					count: data.data.count,-->
<!--					terminate_time: dataUser.terminate_time,-->
<!--					avatar: '',-->
<!--					kid: '',-->
<!--					description: '',-->
<!--                    cus_url-->
<!--				}-->

<!--				useUser.updateUserInfo(user)-->
<!--				loginModal.value = false;-->
<!--				dataValue();-->
<!--				geterwm_v3();-->

<!--				ms.success('登录成功');-->
<!--			} else {-->
<!--				ms.error(data.msg)-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误1！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误2！')-->
<!--	})-->

<!--}-->



<!--const handleValidateButtonClick2 = () => {-->
<!--	console.log(formValue2)-->
<!--	return-->
<!--}-->

<!--var seconds =60;-->

<!--const getCode=()=>{-->
<!--    	axios.post(VITE_APP_API + '/api/sendSms', {-->
<!--		"accout_type": 1,-->
<!--		'phone': formValue3.value.phone-->
<!--	}).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->

<!--			      const timer = setInterval(() => {-->
<!--                  if (seconds > 0) {-->
<!--                      user_code.value=`剩余时间 ${seconds}秒`-->
<!--                    user_code_show.value=2;-->
<!--                      seconds&#45;&#45;;-->
<!--                  } else {-->
<!--                    clearInterval(timer);-->
<!--                    user_code.value=`获取验证码`;-->
<!--                    user_code_show.value=1;-->
<!--                    console.log("倒计时结束");-->
<!--                  }-->
<!--                }, 1000);-->

<!--				ms.success('发送成功');-->
<!--			} else {-->
<!--				ms.error(data.msg)-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误1！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误2！')-->
<!--	})-->

<!--}-->

<!--const handleValidateButtonClick3=()=>{-->

<!--	axios.post(VITE_APP_API + '/api/register', {-->
<!--		"accout_type": 1,-->
<!--		'phone': formValue3.value.phone,-->
<!--		'password': formValue3.value.password,-->
<!--		'code': formValue3.value.code-->
<!--	}).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->

<!--			 loginModal2.value=false-->
<!--				ms.success('修改成功');-->
<!--			} else {-->
<!--				ms.error(data.msg)-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误1！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误2！')-->
<!--	})-->


<!--}-->

<!--//登录拦截-->
<!--function handleSubmit() {-->

<!--	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->

<!--	axios.post(VITE_APP_API + '/api/user/user_verify',-->
<!--        {-->
<!--            "accout_type": 1,-->
<!--            'message':-->
<!--            prompt.value-->
<!--        },-->
<!--        http_config-->
<!--    ).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				if (data.data.is_expire == 1) {-->
<!--					var k8 = data.data.k8;-->

<!--					onConversation(k8);-->
<!--				} else {-->
<!--					ms.error('账号已过期！')-->
<!--					show.value = true-->
<!--				}-->
<!--			} else if (data.code == 401) {-->
<!--				loginModal.value = true;-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				ms.error(data.msg)-->
<!--			} else {-->
<!--				ms.error('网络错误3！')-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误4！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误5！')-->
<!--	})-->
<!--}-->


<!--const zfb_name=ref('');-->
<!--const getProfitList=()=>{-->
<!--    	//  onConversation();-->
<!--    	const token = localStorage.getItem("user_token");-->
<!--    	const http_config = {-->
<!--    		headers: {'Authorization': 'Bearer ' + token}-->
<!--    	};-->
<!--    	axios.post(VITE_APP_API+'/api/user/getProfitList',{"accout_type":1},http_config).then(res=>{-->
<!--		if(res.status == 200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->
<!--		         zfb_name.value=data.data.admin.zfb_name-->
<!--			}else if(data.code==401){-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error ('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			}else if(data.code==400){-->
<!--				ms.error (data.msg)-->
<!--			}else{-->
<!--				ms.error ('网络错误！')-->
<!--			}-->
<!--		}else{-->
<!--			ms.error ('网络错误！')-->
<!--		}-->
<!--	}).catch(error=>{-->
<!--		ms.error ('网络错误！')-->
<!--	})-->
<!--}-->



<!--//重新生成-->
<!--function handleRegenerate(index: number) {-->
<!--	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->
<!--	axios.post(VITE_APP_API + '/api/user/user_verify', {"accout_type": 1,'message':prompt.value}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				if (data.data.is_expire == 1) {-->
<!--					var k8 = data.data.k8;-->
<!--					onRegenerate(index, k8);-->

<!--						useUser.updateUserInfo(user)-->
<!--				} else {-->
<!--					ms.error('账号已过期！')-->
<!--					show.value = true-->
<!--				}-->
<!--			} else if (data.code == 401) {-->
<!--				loginModal.value = true;-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				ms.error(data.msg)-->
<!--			} else {-->
<!--				ms.error('网络错误！')-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误！')-->
<!--	})-->


<!--	/*		localStorage.setItem('user_token','123')-->
<!--			let get1 = localStorage.getItem("user_token");*/-->

<!--}-->


<!--async function onConversation(k8: string) {-->
<!--	let message = prompt.value-->

<!--	if (loading.value)-->
<!--		return-->

<!--	if (!message || message.trim() === '')-->
<!--		return-->

<!--	controller = new AbortController()-->

<!--	addChat(-->
<!--		+uuid,-->
<!--		{-->
<!--			dateTime: new Date().toLocaleString(),-->
<!--			text: message,-->
<!--			inversion: true,-->
<!--			error: false,-->
<!--			conversationOptions: null,-->
<!--			requestOptions: {prompt: message, options: null},-->
<!--		},-->
<!--	)-->

<!--	scrollToBottom()-->

<!--	loading.value = true-->
<!--	prompt.value = ''-->

<!--	let options: Chat.ConversationRequest = {}-->
<!--	const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions-->

<!--	if (lastContext && usingContext.value)-->
<!--		options = {...lastContext}-->

<!--	addChat(-->
<!--		+uuid,-->
<!--		{-->
<!--			dateTime: new Date().toLocaleString(),-->
<!--			text: '',-->
<!--			loading: true,-->
<!--			inversion: false,-->
<!--			error: false,-->
<!--			conversationOptions: null,-->
<!--			requestOptions: {prompt: message, options: {...options}},-->
<!--		},-->
<!--	)-->
<!--	scrollToBottom()-->


<!--	try {-->
<!--		let lastText = ''-->
<!--		const fetchChatAPIOnce = async () => {-->

<!--			await fetchChatAPIProcess<Chat.ConversationResponse>({-->
<!--				k8: k8,-->
<!--				prompt: message,-->
<!--				options,-->
<!--				signal: controller.signal,-->
<!--				onDownloadProgress: ({event}) => {-->
<!--					const xhr = event.target-->
<!--					const {responseText} = xhr-->
<!--					// Always process the final line-->
<!--					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)-->
<!--					let chunk = responseText-->
<!--					if (lastIndex !== -1)-->
<!--						chunk = responseText.substring(lastIndex)-->
<!--					try {-->
<!--						const data = JSON.parse(chunk)-->

<!--						updateChat(-->
<!--							+uuid,-->
<!--							dataSources.value.length - 1,-->
<!--							{-->
<!--								dateTime: new Date().toLocaleString(),-->
<!--								text: lastText + (data.text ?? ''),-->
<!--								inversion: false,-->
<!--								error: false,-->
<!--								loading: true,-->
<!--								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},-->
<!--								requestOptions: {prompt: message, options: {...options}},-->
<!--							},-->
<!--						)-->

<!--						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {-->
<!--							options.parentMessageId = data.id-->
<!--							lastText = data.text-->
<!--							message = ''-->
<!--							return fetchChatAPIOnce()-->
<!--						}-->

<!--						scrollToBottomIfAtBottom()-->
<!--					} catch (error) {-->
<!--						//-->
<!--					}-->
<!--				},-->
<!--			})-->
<!--			updateChatSome(+uuid, dataSources.value.length - 1, {loading: false})-->
<!--		}-->

<!--		await fetchChatAPIOnce()-->
<!--	} catch (error: any) {-->
<!--		const errorMessage = error?.message ?? t('common.wrong')-->

<!--		if (error.message === 'canceled') {-->
<!--			updateChatSome(-->
<!--				+uuid,-->
<!--				dataSources.value.length - 1,-->
<!--				{-->
<!--					loading: false,-->
<!--				},-->
<!--			)-->
<!--			scrollToBottomIfAtBottom()-->
<!--			return-->
<!--		}-->

<!--		const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)-->

<!--		if (currentChat?.text && currentChat.text !== '') {-->
<!--			updateChatSome(-->
<!--				+uuid,-->
<!--				dataSources.value.length - 1,-->
<!--				{-->
<!--					text: `${currentChat.text}\n[${errorMessage}]`,-->
<!--					error: false,-->
<!--					loading: false,-->
<!--				},-->
<!--			)-->
<!--			return-->
<!--		}-->

<!--		updateChat(-->
<!--			+uuid,-->
<!--			dataSources.value.length - 1,-->
<!--			{-->
<!--				dateTime: new Date().toLocaleString(),-->
<!--				text: errorMessage,-->
<!--				inversion: false,-->
<!--				error: true,-->
<!--				loading: false,-->
<!--				conversationOptions: null,-->
<!--				requestOptions: {prompt: message, options: {...options}},-->
<!--			},-->
<!--		)-->
<!--		scrollToBottomIfAtBottom()-->
<!--	} finally {-->
<!--		loading.value = false-->
<!--	}-->
<!--}-->

<!--async function onRegenerate(index: number, k8: string) {-->
<!--	if (loading.value)-->
<!--		return-->

<!--	controller = new AbortController()-->

<!--	const {requestOptions} = dataSources.value[index]-->

<!--	let message = requestOptions?.prompt ?? ''-->

<!--	let options: Chat.ConversationRequest = {}-->

<!--	if (requestOptions.options)-->
<!--		options = {...requestOptions.options}-->

<!--	loading.value = true-->

<!--	updateChat(-->
<!--		+uuid,-->
<!--		index,-->
<!--		{-->
<!--			dateTime: new Date().toLocaleString(),-->
<!--			text: '',-->
<!--			inversion: false,-->
<!--			error: false,-->
<!--			loading: true,-->
<!--			conversationOptions: null,-->
<!--			requestOptions: {prompt: message, options: {...options}},-->
<!--		},-->
<!--	)-->

<!--	try {-->
<!--		let lastText = ''-->
<!--		const fetchChatAPIOnce = async () => {-->
<!--			await fetchChatAPIProcess<Chat.ConversationResponse>({-->
<!--				k8: k8,-->
<!--				prompt: message,-->
<!--				options,-->
<!--				signal: controller.signal,-->
<!--				onDownloadProgress: ({event}) => {-->
<!--					const xhr = event.target-->
<!--					const {responseText} = xhr-->
<!--					// Always process the final line-->
<!--					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)-->
<!--					let chunk = responseText-->
<!--					if (lastIndex !== -1)-->
<!--						chunk = responseText.substring(lastIndex)-->
<!--					try {-->
<!--						const data = JSON.parse(chunk)-->
<!--						updateChat(-->
<!--							+uuid,-->
<!--							index,-->
<!--							{-->
<!--								dateTime: new Date().toLocaleString(),-->
<!--								text: lastText + (data.text ?? ''),-->
<!--								inversion: false,-->
<!--								error: false,-->
<!--								loading: true,-->
<!--								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},-->
<!--								requestOptions: {prompt: message, options: {...options}},-->
<!--							},-->
<!--						)-->

<!--						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {-->
<!--							options.parentMessageId = data.id-->
<!--							lastText = data.text-->
<!--							message = ''-->
<!--							return fetchChatAPIOnce()-->
<!--						}-->
<!--					} catch (error) {-->
<!--						//-->
<!--					}-->
<!--				},-->
<!--			})-->
<!--			updateChatSome(+uuid, index, {loading: false})-->
<!--		}-->
<!--		await fetchChatAPIOnce()-->
<!--	} catch (error: any) {-->
<!--		if (error.message === 'canceled') {-->
<!--			updateChatSome(-->
<!--				+uuid,-->
<!--				index,-->
<!--				{-->
<!--					loading: false,-->
<!--				},-->
<!--			)-->
<!--			return-->
<!--		}-->

<!--		const errorMessage = error?.message ?? t('common.wrong')-->

<!--		updateChat(-->
<!--			+uuid,-->
<!--			index,-->
<!--			{-->
<!--				dateTime: new Date().toLocaleString(),-->
<!--				text: errorMessage,-->
<!--				inversion: false,-->
<!--				error: true,-->
<!--				loading: false,-->
<!--				conversationOptions: null,-->
<!--				requestOptions: {prompt: message, options: {...options}},-->
<!--			},-->
<!--		)-->
<!--	} finally {-->
<!--		loading.value = false-->
<!--	}-->
<!--}-->

<!--function handleExport() {-->



<!--     showStore.value=true;-->






<!--/*	if (loading.value)-->
<!--		return-->

<!--	const d = dialog.warning({-->
<!--		title: t('chat.exportImage'),-->
<!--		content: t('chat.exportImageConfirm'),-->
<!--		positiveText: t('common.yes'),-->
<!--		negativeText: t('common.no'),-->
<!--		onPositiveClick: async () => {-->
<!--			try {-->
<!--				d.loading = true-->
<!--				const ele = document.getElementById('image-wrapper')-->
<!--				const canvas = await html2canvas(ele as HTMLDivElement, {-->
<!--					useCORS: true,-->
<!--				})-->
<!--				const imgUrl = canvas.toDataURL('image/png')-->
<!--				const tempLink = document.createElement('a')-->
<!--				tempLink.style.display = 'none'-->
<!--				tempLink.href = imgUrl-->
<!--				tempLink.setAttribute('download', 'chat-shot.png')-->
<!--				if (typeof tempLink.download === 'undefined')-->
<!--					tempLink.setAttribute('target', '_blank')-->

<!--				document.body.appendChild(tempLink)-->
<!--				tempLink.click()-->
<!--				document.body.removeChild(tempLink)-->
<!--				window.URL.revokeObjectURL(imgUrl)-->
<!--				d.loading = false-->
<!--				ms.success(t('chat.exportSuccess'))-->
<!--				Promise.resolve()-->
<!--			} catch (error: any) {-->
<!--				ms.error(t('chat.exportFailed'))-->
<!--			} finally {-->
<!--				d.loading = false-->
<!--			}-->
<!--		},-->
<!--	})*/-->
<!--}-->

<!--function handleDelete(index: number) {-->
<!--	if (loading.value)-->
<!--		return-->

<!--	dialog.warning({-->
<!--		title: t('chat.deleteMessage'),-->
<!--		content: t('chat.deleteMessageConfirm'),-->
<!--		positiveText: t('common.yes'),-->
<!--		negativeText: t('common.no'),-->
<!--		onPositiveClick: () => {-->
<!--			chatStore.deleteChatByUuid(+uuid, index)-->
<!--		},-->
<!--	})-->
<!--}-->

<!--function handleClear() {-->
<!--	if (loading.value)-->
<!--		return-->

<!--	//检查是否有缓存-->
<!--  let ret=  promptTemplate.value-->
<!--  if(ret =='' ||  ret.length <=0){-->
<!--      console.log('mmmm');-->
<!--      handleExport()-->
<!--     return false;-->
<!--  }-->
<!--	prompt.value="@"-->

<!--   inputRef.value?.focus()-->

<!--/*	dialog.warning({-->
<!--		title: t('chat.clearChat'),-->
<!--		content: t('chat.clearChatConfirm'),-->
<!--		positiveText: t('common.yes'),-->
<!--		negativeText: t('common.no'),-->
<!--		onPositiveClick: () => {-->
<!--			chatStore.clearChatByUuid(+uuid)-->
<!--		},-->
<!--	})*/-->
<!--}-->

<!--function handleEnter(event: KeyboardEvent) {-->


<!--	if (!isMobile.value) {-->
<!--		if (event.key === 'Enter' && !event.shiftKey) {-->
<!--			event.preventDefault()-->
<!--			handleSubmit()-->
<!--		}-->
<!--	} else {-->
<!--		if (event.key === 'Enter' && event.ctrlKey) {-->
<!--			event.preventDefault()-->
<!--			handleSubmit()-->
<!--		}-->
<!--	}-->
<!--}-->

<!--function handleStop() {-->
<!--	if (loading.value) {-->
<!--		controller.abort()-->
<!--		loading.value = false-->
<!--	}-->
<!--}-->

<!--// 可优化部分-->
<!--// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)-->
<!--// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现-->
<!--const searchOptions = computed( () => {-->
<!--	if (prompt.value.startsWith('@')) {-->

<!--		return promptTemplate.value.filter((item: {-->
<!--			key: string-->
<!--		}) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {-->
<!--			return {-->
<!--				label: obj.value,-->
<!--				value: obj.value,-->
<!--			}-->
<!--		})-->
<!--	} else {-->
<!--		return []-->
<!--	}-->
<!--})-->


<!--const dataValue = async ()=>{-->

<!--	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->
<!--	axios.post(VITE_APP_API + '/api/user/skill',  {"accout_type": 1}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				promptTemplate.value=data.data;-->
<!--			} else if (data.code == 401) {-->
<!--				loginModal.value = true;-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				ms.error(data.msg)-->
<!--			} else {-->
<!--				ms.error('网络错误1！')-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误2！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误3！')-->
<!--	})-->
<!--}-->

<!--// value反渲染key-->
<!--const renderOption = (option: { label: string }) => {-->
<!--	for (const i of promptTemplate.value) {-->
<!--		if (i.value === option.label)-->
<!--			return [i.key]-->
<!--	}-->
<!--	return []-->
<!--}-->

<!--const placeholder = computed(() => {-->
<!--	if (isMobile.value)-->
<!--		return t('chat.placeholderMobile')-->
<!--	return t('chat.placeholder')-->
<!--})-->

<!--const buttonDisabled = computed(() => {-->
<!--	return loading.value || !prompt.value || prompt.value.trim() === ''-->
<!--})-->

<!--const footerClass = computed(() => {-->
<!--	let classes = ['p-4']-->
<!--	if (isMobile.value)-->
<!--		classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']-->
<!--	return classes-->

<!--})-->
<!--const ModalShow = ref(false);-->
<!--const user_fx_url = ref("");-->

<!--const  geterwm_v3 = () => {-->
<!--    	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->
<!--	axios.post(VITE_APP_API+'/api/user/geterwm_v3',{"accout_type":1},http_config).then(res=>{-->
<!--		if(res.status ==200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->

<!--				user_fx_url.value=data.data.url;-->

<!--			}else if(data.code==401){-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error ('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			}else if(data.code==400){-->
<!--				ms.error (data.msg)-->
<!--			}else{-->
<!--				ms.error ('网络错误！')-->
<!--			}-->
<!--		}else{-->
<!--			ms.error ('网络错误！')-->
<!--		}-->
<!--	}).catch(error=>{-->
<!--		ms.error ('网络错误！')-->
<!--	})-->
<!--}-->
<!--const user_fx_url_cilic = () => {-->
<!--    return false;-->
<!--    ModalShow.value = true-->
<!--}-->

<!--onMounted(() => {-->


<!--/*	const userRouter = useRouter()-->
<!--	 console.log(userRouter.currentRoute.value.query)*/-->


<!--	const token = localStorage.getItem("user_token");-->

<!--	if (token == '' || token == null || token == 'undefined') {-->
<!--		loginModal.value = true;-->
<!--		localStorage.clear()-->
<!--		useUser.resetUserInfo()-->
<!--	}else{-->
<!--		is_login();-->
<!--	}-->

<!--	scrollToBottom()-->
<!--	if (inputRef.value && !isMobile.value)-->
<!--		inputRef.value?.focus()-->


<!--})-->


<!--/**-->
<!-- * 检查是否登录-->
<!-- */-->
<!--const is_login= () => {-->
<!--	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->
<!--	axios.post(VITE_APP_API + '/api/user/user_verify',  {"accout_type": 1,'message':prompt.value}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				if (data.data.is_expire == 1) {-->
<!--                    	dataValue();-->
<!--                    	geterwm_v3();-->
<!--                    	getProfitList();-->

<!--				} else {-->
<!--					ms.error('账号已过期！')-->
<!--					show.value = true-->
<!--				}-->
<!--			} else if (data.code == 401) {-->
<!--				loginModal.value = true;-->
<!--				localStorage.setItem('user_token','')-->
<!--				ms.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				ms.error(data.msg)-->
<!--			} else {-->
<!--				ms.error('网络错误！')-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误！')-->
<!--	})-->
<!--}-->

<!--const showModal= ref(false)-->
<!--function tg(){-->

<!--  if(!localStorage.getItem('user_token')){-->
<!--    localStorage.clear()-->
<!--    location.reload()-->
<!--  }else{-->
<!--    showModal.value = true-->
<!--  }-->
<!--}-->


<!--onUnmounted(() => {-->
<!--	if (loading.value)-->
<!--		controller.abort()-->
<!--})-->

<!--</script>-->

<!--<template>-->
<!--    <div class="flex flex-col w-full h-full">-->

<!--        <NModal v-model:show="ModalShow" style="width:100%; max-width: 540px">-->
<!--        <img :src="user_fx_url"   />-->
<!--        </NModal>-->

<!--        <NModal v-model:show="loginModal" style="width: 90%; max-width: 540px">-->
<!--        <div>-->
<!--            <n-card-->

<!--                title="登录"-->
<!--                :bordered="false"-->
<!--                size="huge"-->
<!--                role="dialog"-->
<!--                aria-modal="true"-->
<!--            >-->

<!--                <n-form ref="formRef" :model="formValue">-->
<!--                    <div>账号</div>-->
<!--                    <n-form-item path="phone" label="账号">-->
<!--                        <n-input v-model:value="formValue.phone" placeholder="请输入手机号"/>-->
<!--                    </n-form-item>-->


<!--                    <div style="margin-top:10px">密码</div>-->
<!--                    <n-form-item path="password" label="密码">-->
<!--                        <n-input-->
<!--                            v-model:value="formValue.password"-->
<!--                            type="password"-->
<!--                            placeholder="请输入密码"-->
<!--                        />-->
<!--                    </n-form-item>-->

<!--                    <n-row :gutter="[0, 24]">-->
<!--                        <n-col :span="24">-->
<!--                            <div style="display: flex; justify-content: center;margin-top: 20px">-->
<!--                                <n-button-->
<!--                                    type="primary"-->
<!--                                    style="width: 100%"-->
<!--                                    @click="handleValidateButtonClick"-->
<!--                                >-->
<!--                                    登录-->
<!--                                </n-button>-->
<!--                            </div>-->
<!--                        </n-col>-->
<!--                    </n-row>-->
<!--                </n-form>-->

<!--                <div style="display: flex; justify-content:space-between;margin-top: 20px">-->
<!--                <div style="text-align:center;">海报扫码开通账号</div>-->
<!--                <div style="text-align:center;cursor: pointer;" @click='re'>忘记密码？</div>-->
<!--                </div>-->
<!--                <div style="height: 50px"></div>-->
<!--            </n-card>-->
<!--        </div>-->
<!--        </NModal>-->

<!--        <NModal v-model:show="loginModal2" style="width: 90%; max-width: 540px">-->
<!--        <div>-->
<!--            <n-card-->

<!--                title="修改密码"-->
<!--                :bordered="false"-->
<!--                size="huge"-->
<!--                role="dialog"-->
<!--                aria-modal="true"-->
<!--            >-->

<!--                <n-form ref="formRef" :model="formValue3">-->
<!--                    <div>账号</div>-->
<!--                    <n-form-item path="phone" label="账号">-->
<!--                        <n-input v-model:value="formValue3.phone" placeholder="请输入手机号"/>-->
<!--                    </n-form-item>-->

<!--                    <div  style="margin-top:10px">密码</div>-->
<!--                    <n-form-item path="phone" label="密码">-->
<!--                        <n-input v-model:value="formValue3.password" 	type="password" placeholder="请输入密码"/>-->
<!--                    </n-form-item>-->

<!--                    <div style="margin-top:10px">验证码</div>-->
<!--                    <div style="display:flex;justify-content: space-between;">-->
<!--                        <div style="width:60%">-->
<!--                        <n-form-item path="code" label="验证码">-->
<!--                            <n-input-->
<!--                                v-model:value="formValue3.code"-->
<!--                                placeholder="请输入验证码"-->
<!--                            />-->
<!--                        </n-form-item>-->
<!--                        </div>-->
<!--                        <div>-->
<!--                               <n-button type="success" v-if="user_code_show==1"  @click="getCode">{{user_code}}</n-button>-->
<!--                               <n-button type="tertiary" v-else >{{user_code}}</n-button>-->
<!--                         </div>-->
<!--                    </div>-->


<!--                    <n-row :gutter="[0, 24]">-->
<!--                        <n-col :span="24">-->
<!--                            <div style="display: flex; justify-content: center;margin-top: 20px">-->
<!--                                <n-button-->
<!--                                    type="primary"-->
<!--                                    style="width: 100%"-->
<!--                                    @click="handleValidateButtonClick3"-->
<!--                                >-->
<!--                                    确认修改-->
<!--                                </n-button>-->
<!--                            </div>-->
<!--                        </n-col>-->
<!--                    </n-row>-->
<!--                </n-form>-->


<!--                <div style="height: 50px"></div>-->
<!--            </n-card>-->
<!--        </div>-->
<!--        </NModal>-->

<!--        <NModal v-model:show="loginModal3" style="width:100%; max-width: 540px">-->
<!--        <div >-->
<!--               <img :src="vimgs" @click="chatout_img"  />-->
<!--        </div>-->
<!--        </NModal>-->

<!--        <NModal v-model:show="modifyModal" style="width: 90%; max-width: 540px">-->
<!--        <div>-->
<!--            <n-card-->
<!--                title="修改登录"-->
<!--                :bordered="false"-->
<!--                size="huge"-->
<!--                role="dialog"-->
<!--                aria-modal="true"-->
<!--            >-->

<!--                <n-form ref="formRef2" :model="formValue2">-->
<!--                    <div>原密码</div>-->
<!--                    <n-form-item path="oldpassword" label="原密码">-->
<!--                        <n-input v-model:value="formValue2.oldpassword" placeholder="请输入原密码"/>-->
<!--                    </n-form-item>-->


<!--                    <div style="margin-top:10px">新密码</div>-->
<!--                    <n-form-item path="newpassword" label="新密码">-->
<!--                        <n-input-->
<!--                            v-model:value="formValue2.newpassword"-->
<!--                            type="password"-->
<!--                            placeholder="请输入新密码"-->
<!--                        />-->
<!--                    </n-form-item>-->

<!--                    <div style="margin-top:10px">确认新密码</div>-->
<!--                    <n-form-item path="password" label="确认新密码">-->
<!--                        <n-input-->
<!--                            v-model:value="formValue2.password"-->
<!--                            type="password"-->
<!--                            placeholder="请输入确认新密码"-->
<!--                        />-->
<!--                    </n-form-item>-->

<!--                    <n-row :gutter="[0, 24]">-->
<!--                        <n-col :span="24">-->
<!--                            <div style="display: flex; justify-content: center;margin-top: 20px">-->
<!--                                <n-button-->
<!--                                    type="primary"-->
<!--                                    style="width: 100%"-->
<!--                                    @click="handleValidateButtonClick2"-->
<!--                                >-->
<!--                                    修改密码-->
<!--                                </n-button>-->
<!--                            </div>-->
<!--                        </n-col>-->
<!--                    </n-row>-->
<!--                </n-form>-->
<!--                <div style="height: 50px"></div>-->
<!--            </n-card>-->
<!--        </div>-->
<!--        </NModal>-->

<!--        <HeaderComponent-->
<!--        v-if="isMobile"-->
<!--        :using-context="usingContext"-->
<!--        @export="handleExport"-->
<!--        @toggle-using-context="toggleUsingContext"-->
<!--        @tg="tg"-->
<!--        />-->
<!--        <main class="flex-1 overflow-hidden">-->
<!--            <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">-->
<!--            <div-->
<!--                id="image-wrapper"-->
<!--                class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"-->
<!--                :class="[isMobile ? 'p-2' : 'p-4']"-->
<!--            >-->
<!--                <template v-if="!dataSources.length" >-->
<!--                    <div class="flex items-center justify-center mt-6 text-center text-neutral-300 text-[#4f555e]" @click="yingdao">-->
<!--                        <SvgIcon icon="mingcute:finger-press-line" class="mr-2 mt-6 text-4xl  text-[#4f555e]" />-->
<!--                    </div>-->
<!--                    <div class="flex items-center justify-center mt-4 text-center text-neutral-300" @click="yingdao">-->
<!--                        <div><span style="color:#666">新手引导助手</span></div>-->
<!--                    </div>-->
<!--                </template>-->
<!--                <template v-else>-->
<!--                    <div @click="user_fx_url_cilic">-->
<!--                        <Message-->
<!--                            v-for="(item, index) of dataSources"-->
<!--                            :key="index"-->
<!--                            :date-time="item.dateTime"-->
<!--                            :text="item.text"-->
<!--                            :inversion="item.inversion"-->
<!--                            :error="item.error"-->
<!--                            :loading="item.loading"-->
<!--                            @regenerate="handleRegenerate(index)"-->
<!--                            @delete="handleDelete(index)"-->

<!--                        />-->
<!--                        <div class="sticky bottom-0 left-0 flex justify-center">-->
<!--                            <NButton v-if="loading" type="warning" @click="handleStop">-->
<!--                                <template #icon>-->
<!--                                    <SvgIcon icon="ri:stop-circle-line"/>-->
<!--                                </template>-->
<!--                                Stop Responding-->
<!--                            </NButton>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </template>-->
<!--            </div>-->
<!--        </div>-->
<!--        </main>-->
<!--        <footer :class="footerClass">-->
<!--            <div class="w-full max-w-screen-xl m-auto">-->
<!--                <div class="flex items-center justify-between space-x-2">-->
<!--                    <HoverButton @click="handleClear">-->
<!--            <span class="text-xl text-[#4f555e] dark:text-white">-->
<!--              <SvgIcon icon="vaadin:at"/>-->

<!--            </span>-->
<!--                    </HoverButton>-->
<!--            <HoverButton v-if="!isMobile" @click="handleExport">-->
<!--            <span class="text-xl text-[#4f555e] dark:text-white">-->
<!--               <SvgIcon icon="mdi:chat-plus-outline"/>-->
<!--            </span>-->
<!--                    </HoverButton>-->
<!--            <HoverButton v-if="!isMobile" @click="tg">-->
<!--                <span class="text-xl text-[#4f555e] dark:text-white" >-->
<!--                  <SvgIcon icon="octicon:people-16"/>-->
<!--                </span>-->
<!--            </HoverButton>-->


<!--            &lt;!&ndash;					<HoverButton v-if="!isMobile" @click="toggleUsingContext">-->
<!--            <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">-->
<!--              <SvgIcon icon="ri:chat-history-line"/>-->
<!--            </span>-->
<!--                    </HoverButton>&ndash;&gt;-->
<!--                    <NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">-->
<!--                        <template #default="{ handleInput, handleBlur, handleFocus }">-->
<!--                            <NInput-->
<!--                                ref="inputRef"-->
<!--                                v-model:value="prompt"-->
<!--                                type="textarea"-->
<!--                                :placeholder="placeholder"-->
<!--                                :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"-->
<!--                                @input="handleInput"-->
<!--                                @focus="handleFocus"-->
<!--                                @blur="handleBlur"-->
<!--                                @keypress="handleEnter"-->
<!--                            />-->
<!--                        </template>-->
<!--                    </NAutoComplete>-->
<!--                    <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">-->
<!--                        <template #icon>-->
<!--                          <span class="dark:text-black">-->
<!--                            <SvgIcon icon="ri:send-plane-fill"/>-->
<!--                          </span>-->
<!--                        </template>-->
<!--                    </NButton>-->
<!--                </div>-->
<!--            </div>-->
<!--        </footer>-->

<!--    </div>-->

<!--    <Setting v-if="show" v-model:visible="show" />-->

<!--    <PromptStore v-model:visible="showStore" />-->

<!--    <Setting2 v-if="showModal" v-model:visible="showModal" />-->

<!--    <NModal v-model:show="ModalShow2"  :auto-focus="false" z-index="99999" preset="card" style="width: 95%; max-width: 500px;min-height:80vh">-->
<!--		 <img :src="user_fx_url"  style=""/>-->
<!--	</NModal>-->
<!--</template>-->
