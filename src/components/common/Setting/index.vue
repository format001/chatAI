<script setup lang='ts'>
import QRCode from 'qrcodejs2-fixes';
import {computed, ref, onMounted, nextTick, toRefs, reactive} from 'vue'
import {NButton, NInput, NModal, NTabPane, NTabs, useMessage} from 'naive-ui'
// import General from './General.vue'
// import Advanced from './Advanced.vue'
// import About from './About.vue'
// import { useAuthStore } from '@/store'
import {UserAvatar} from '@/components/common'
import {httpPost} from "@/utils/request/service";
import ChangePasswordComponent from "@/components/Login/ChangePassword.vue";


interface Props {
    visible: boolean
}

interface Emit {
    (e: 'update:visible', visible: boolean): void
}

	const props = defineProps<Props>();
	const emit = defineEmits<Emit>();


	const message = useMessage()
	const active = ref(0)
	const order_id = ref();
	var pay_url = ref();

	let cardList = ref([])

	onMounted(() => {
		handleSubmit();
	});

	const show = computed({
		get() {
			return props.visible
		},
		set(visible: boolean) {
			emit('update:visible', visible)
		},
	})

const http_config = {
    headers: {'Authorization': 'Bearer ' +  localStorage.getItem("user_token")}
};

	//获取月卡
async function handleSubmit() {
		const data = await httpPost(('/api/user/card'), {
								"accout_type": 1
					}, http_config, message);

		cardList.value = data.data.list
		pay(data.data.list[0], 0)
}

//调用支付
async function pay(item, index) {
	active.value = index;

	const data = await httpPost(('/api/user/card_order'), {
							"accout_type": 1,
							'card_id': item.id
						}, http_config, message);

		pay_url = data.data.from;
		initQrcode(data.data.from);
}

const pay2 = () => {
    window.location.href = pay_url
}

const qrcodeRef = ref<HTMLElement | null>(null);
const initQrcode = (content: any) => {
	(<HTMLElement>qrcodeRef.value).innerHTML = ''
    nextTick(() => {
        new QRCode(qrcodeRef.value, {
            text: content,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
        });
    });
};

function quitEvent() {
    localStorage.clear()
    location.reload()
}

</script>

<template>
    <NModal v-model:show="show" :auto-focus="false" preset="card" style="width: 95%; max-width: 500px;min-height:50vh">
        <n-tabs type="line" animated>
            <n-tab-pane name="recharge" tab="会员续费">
                <div>
                    <div style="display:flex;flex-wrap:wrap;justify-content:center">
                        <div><img src="@/assets/member.jpg"></div>

                        <div class="card_list" :class="[index == active? 'curr' : '']" @click="pay(item,index)"
                             v-for="(item, index ) in cardList" :key="index">
                            <div>{{ item.title }}</div>
                            <div>{{ item.price }}元</div>
                        </div>

                    </div>

                    <div style="text-align: center;margin-top: 20px">
                        <div ref="qrcodeRef" style="width:200px;height: 200px;margin: auto " @click='pay2()'></div>
                        <div style="padding-top:20px">请使用微信扫一扫</div>
                    </div>
                </div>
            </n-tab-pane>
            <n-tab-pane name="changePassword" tab="修改密码">
                <ChangePasswordComponent v-model:show="show" />
            </n-tab-pane>
            <n-tab-pane name="myCenter" tab="个人中心">
                <div class="flex-1 flex-shrink-0 overflow-hidden;" style="text-align: center">
                    <UserAvatar type="start"/>
                </div>
                <div style="display: flex; justify-content: center;margin-top: 20px">
                    <n-button
                        type="primary"
                        color="#FF5D5D"
                        style="width: 100%"
                        @click="quitEvent()"
                    >
                        退出登录
                    </n-button>
                </div>
            </n-tab-pane>
        </n-tabs>
    </NModal>
</template>

<style>
.card_list {
    border: 1px solid #18a058;
    padding: 5px 25px;
    border-radius: 5px;
    text-align: center;
    color: #18a058;
    margin-right: 10px;
    margin-top: 10px
}

.curr {
    border-color: red;
    color: red;
}

</style>












<!--<script setup lang='ts'>-->
<!--import QRCode from 'qrcodejs2-fixes';-->
<!--import {computed, ref, onMounted, nextTick} from 'vue'-->
<!--import {NButton, NInput, NModal, NTabPane, NTabs, useMessage} from 'naive-ui'-->
<!--// import General from './General.vue'-->
<!--// import Advanced from './Advanced.vue'-->
<!--// import About from './About.vue'-->
<!--// import { useAuthStore } from '@/store'-->
<!--import {UserAvatar} from '@/components/common'-->


<!--import axios from "axios";-->
<!--import {httpPost} from "@/utils/request/service";-->

<!--const ms = useMessage()-->
<!--//获取请求地址-->
<!--const VITE_APP_API = import.meta.env.VITE_APP_API;-->


<!--interface Props {-->
<!--	visible: boolean-->
<!--}-->

<!--interface Emit {-->
<!--	(e: 'update:visible', visible: boolean): void-->
<!--}-->

<!--const props = defineProps<Props>(),-->
<!--	emit = defineEmits<Emit>();-->


<!--const active = ref(0)-->
<!--const order_id = ref();-->
<!--var pay_url = ref();-->

<!--const cardList = ref()-->

<!--const http_config = {-->
<!--	headers: {'Authorization': 'Bearer ' +  localStorage.getItem("user_token")}-->
<!--};-->


<!--const formValue2 = ref({-->
<!--	opassword: '',-->
<!--	password: '',-->
<!--	repassword: '',-->
<!--})-->

<!--const handleValidateButtonClick2 = () => {-->
<!--	axios.post(VITE_APP_API + '/api/user/opRegister', {-->
<!--		opassword: formValue2.value.opassword,-->
<!--		password: formValue2.value.password,-->
<!--		repassword: formValue2.value.repassword,-->
<!--	}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				ms.success('修改成功');-->
<!--				emit('update:visible', false)-->
<!--			} else {-->
<!--				ms.error(data.msg)-->
<!--			}-->
<!--		} else {-->
<!--			ms.error('网络错误！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		ms.error('网络错误！')-->
<!--	})-->
<!--}-->

<!--/**-->
<!-- * 检查订单是否支付成功-->
<!-- */-->
<!--const checkOrder = () => {-->
<!--	if (!order_id.value) {-->
<!--		return false;-->
<!--	}-->
<!--	axios.post(VITE_APP_API + '/api/user/checkOrder', {"order_id": order_id.value}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->

<!--			} else if (data.code == 401) {-->
<!--				localStorage.setItem('user_token', '')-->
<!--				localStorage.clear()-->
<!--				location.reload()-->
<!--				ms.error('登录已失效！')-->

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


<!--//获取月卡-->
<!--async function handleSubmit() {-->
<!--	const data = await httpPost(('/api/user/card'), {-->
<!--		"accout_type": 1-->
<!--	}, http_config, ms);-->

<!--	cardList.value = data.data.list-->
<!--	pay(data.data.list[0], 0)-->
<!--}-->

<!--//调用支付-->
<!--async function pay(item, index) {-->
<!--	active.value = index;-->

<!--	const data = await httpPost(('/api/user/card_order'), {-->
<!--		"accout_type": 1,-->
<!--		'card_id': item.id-->
<!--	}, http_config, ms);-->

<!--	pay_url = data.data.from;-->
<!--	initQrcode(data.data.from);-->
<!--}-->
<!--const pay = (item: any, index: any) => {-->
<!--	active.value = index;-->
<!--	axios.post(VITE_APP_API + '/api/user/card_order', {"accout_type": 1, 'card_id': item.id}, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				pay_url = data.data.from;-->
<!--				initQrcode(data.data.from);-->
<!--			} else if (data.code == 401) {-->
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

<!--const pay2 = () => {-->
<!--	window.location.href = pay_url-->
<!--}-->

<!--const qrcodeRef = ref<HTMLElement | null>(null);-->
<!--const initQrcode = (content: any) => {-->

<!--	nextTick(() => {-->
<!--		(<HTMLElement>qrcodeRef.value).innerHTML = '';-->
<!--		new QRCode(qrcodeRef.value, {-->
<!--			text: content,-->
<!--			width: 200,-->
<!--			height: 200,-->
<!--			colorDark: '#000000',-->
<!--			colorLight: '#ffffff',-->
<!--		});-->
<!--	});-->
<!--};-->


<!--onMounted(() => {-->
<!--	handleSubmit();-->
<!--});-->

<!--const show = computed({-->
<!--	get() {-->
<!--		return props.visible-->
<!--	},-->
<!--	set(visible: boolean) {-->
<!--		emit('update:visible', visible)-->
<!--	},-->
<!--})-->


<!--function quitEvent() {-->
<!--	localStorage.clear()-->
<!--	location.reload()-->
<!--}-->

<!--function handleUpdateValue(value: string): void {-->
<!--	if (value == 'recharge') {-->
<!--		handleSubmit();-->
<!--	}-->
<!--}-->
<!--</script>-->

<!--<template>-->
<!--	<NModal v-model:show="show" :auto-focus="false" preset="card" style="width: 95%; max-width: 500px;min-height:50vh">-->
<!--		<n-tabs type="line" animated @update:value="handleUpdateValue">-->
<!--			<n-tab-pane name="recharge" tab="会员续费">-->
<!--				<div>-->
<!--					<div style="display:flex;flex-wrap:wrap;justify-content:center">-->
<!--						<div><img src="https://twzc-icon.oss-cn-beijing.aliyuncs.com/zoogrow/v/mer.jpg"></div>-->

<!--						<div class="card_list" :class="[index==active? 'curr' : '']" @click="pay(item,index)"-->
<!--								 v-for="(item,index ) in cardList" :key="index">-->
<!--							<div>{{ item.title }}</div>-->
<!--							<div>{{ item.price }}元</div>-->
<!--						</div>-->

<!--					</div>-->

<!--					<div style="text-align: center;margin-top: 20px">-->
<!--						<div ref="qrcodeRef" style="width:200px;height: 200px;margin: auto " @click='pay2()'></div>-->
<!--						<div style="padding-top:20px">请使用微信扫一扫</div>-->
<!--					</div>-->
<!--				</div>-->
<!--			</n-tab-pane>-->
<!--			<n-tab-pane name="changePassword" tab="修改密码">-->
<!--				<div>-->
<!--					<n-form ref="formRef2" :model="formValue2">-->
<!--						<div>原密码</div>-->
<!--						<n-form-item path="opassword" label="原密码">-->
<!--							<n-input v-model:value="formValue2.opassword" placeholder="请输入原密码"/>-->
<!--						</n-form-item>-->


<!--						<div style="margin-top:10px">新密码</div>-->
<!--						<n-form-item path="password" label="新密码">-->
<!--							<n-input-->
<!--								v-model:value="formValue2.password"-->
<!--								type="password"-->
<!--								placeholder="请输入新密码"-->
<!--							/>-->
<!--						</n-form-item>-->

<!--						<div style="margin-top:10px">确认新密码</div>-->
<!--						<n-form-item path="repassword" label="确认新密码">-->
<!--							<n-input-->
<!--								v-model:value="formValue2.repassword"-->
<!--								type="password"-->
<!--								placeholder="请输入确认新密码"-->
<!--							/>-->
<!--						</n-form-item>-->

<!--						<n-row :gutter="[0, 24]">-->
<!--							<n-col :span="24">-->
<!--								<div style="display: flex; justify-content: center;margin-top: 20px">-->
<!--									<n-button-->
<!--										type="primary"-->
<!--										style="width: 100%"-->
<!--										@click="handleValidateButtonClick2"-->
<!--									>-->
<!--										修改密码-->
<!--									</n-button>-->
<!--								</div>-->
<!--							</n-col>-->
<!--						</n-row>-->
<!--					</n-form>-->
<!--					<div style="height: 50px"></div>-->

<!--				</div>-->
<!--			</n-tab-pane>-->
<!--			<n-tab-pane name="myCenter" tab="个人中心">-->
<!--				<div class="flex-1 flex-shrink-0 overflow-hidden;" style="text-align: center">-->
<!--					<UserAvatar type="start"/>-->
<!--				</div>-->
<!--				<div style="display: flex; justify-content: center;margin-top: 20px">-->
<!--					<n-button-->
<!--						type="primary"-->
<!--						color="#FF5D5D"-->
<!--						style="width: 100%"-->
<!--						@click="quitEvent()"-->
<!--					>-->
<!--						退出登录-->
<!--					</n-button>-->
<!--				</div>-->
<!--			</n-tab-pane>-->
<!--		</n-tabs>-->
<!--	</NModal>-->
<!--</template>-->

<!--<style>-->
<!--.card_list {-->
<!--	border: 1px solid #18a058;-->
<!--	padding: 5px 25px;-->
<!--	border-radius: 5px;-->
<!--	text-align: center;-->
<!--	color: #18a058;-->
<!--	margin-right: 10px;-->
<!--	margin-top: 10px-->
<!--}-->

<!--.curr {-->
<!--	border-color: red;-->
<!--	color: red;-->
<!--}-->

<!--</style>-->
