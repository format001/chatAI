<script setup lang="ts">
import {
	NButton,
	NCard,
	NInput,
	NModal, useMessage
} from "naive-ui";
import {onActivated, reactive, toRefs, watch} from "vue";
import {httpPost} from "@/utils/request/service";
import {useUserStore} from "@/store";

		const emit = defineEmits(['setModalState']);
		const massage = useMessage(),
				 useUser = useUserStore();

	let {
		show,
		showForm,
		loginFormData,
		second
	} = toRefs(reactive({
				show: true,
				showForm: 'login',
				second: 60,
				loginFormData: {
					phone: '',
					password: '',
					registerPassword: '',
					code: '',
					userCode: '获取验证码'
				},
	}));

	onActivated(() => {
		showForm.value = 'login'
		show.value = true;
	});

	watch(show, (newValue, oldValue) => {
		if (oldValue === true && newValue === false) {
			emit('setModalState', false)
		}
	});

	function onOpenRegisterOrClose(payload) {
		if (payload === 'inRegister'){
			showForm.value = 'register'
		}else if (showForm.value === 'register'){
			showForm.value = 'login'
		}else {
			show.value = false
		}
	}

	async function onConfirmBtn() {
		if(showForm.value === 'login') {
			const loginDate = await httpPost('/api/login', {
				"accout_type": 1,
				'phone': loginFormData.value.phone,
				'password': loginFormData.value.password
			}, {}, massage);
			localStorage.setItem('user_token', loginDate.data.token)
			localStorage.setItem('userInfo', loginDate.data.user);
			let dataUser = loginDate.data.user;
			let { cus_url } = loginDate.data.admin;

			let user = {
				accout_type: dataUser.accout_type,
				customer_id: dataUser.customer_id,
				nickname: dataUser.nickname,
				phone: dataUser.phone,
				count: loginDate.data.count,
				terminate_time: dataUser.terminate_time,
				avatar: '',
				kid: '',
				description: '',
				cus_url
			}

			useUser.updateUserInfo(user)
			show.value = false;
			emit('setModalState', false)
			massage.success('登录成功');
		}else {
			await httpPost('/api/register', {
				"accout_type": 1,
				phone: loginFormData.value.phone,
				password: loginFormData.value.registerPassword,
				code: loginFormData.value.code
			}, {}, massage);

			showForm.value = 'login'
			massage.success('修改成功')
		}

	}

	async function getCode() {
		await httpPost('/api/sendSms', {
			"accout_type": 1,
			'phone': loginFormData.value.phone
		}, {}, massage)

		massage.success('发送成功')

		const timer = setInterval(() => {
			if (second.value -- > 0) {
				loginFormData.value.userCode =`剩余时间 ${ second.value  }秒`
			} else {
				clearInterval(timer);
				second.value = 60;
				loginFormData.value.userCode = `获取验证码`;
			}
		}, 1000);
	}

</script>

<template>
	<NModal v-model:show="show" :maskClosable="false"  @maskClick="onOpenRegisterOrClose" style="width: 90%; max-width: 540px">
			<n-card
				:title="showForm === 'login' ? '登录' : '修改密码'"
				:bordered="false"
				size="huge"
				role="dialog"
				aria-modal="true"
			>
				<n-form ref="formRef" :model="loginFormData">
					<div>账号</div>
					<n-form-item path="phone" label="账号">
						<n-input v-model:value="loginFormData.phone" placeholder="请输入手机号"/>
					</n-form-item>


					<div style="margin-top:10px">密码</div>
					<n-form-item path="password" label="密码">
						<n-input
							v-if="showForm === 'login'"
							v-model:value="loginFormData.password"
							type="password"
							placeholder="请输入密码"
						/>
						<n-input
							v-else
							v-model:value="loginFormData.registerPassword"
							type="password"
							placeholder="请输入新密码"
						/>
					</n-form-item>

					<div v-if="showForm === 'register'" style="margin-top:10px">验证码</div>
					<div v-if="showForm === 'register'" style="display:flex;justify-content: space-between;">
						<div style="width:60%">
							<n-form-item path="code" label="">
								<n-input
									v-model:value="loginFormData.code"
									placeholder="请输入验证码"
								/>
							</n-form-item>
						</div>
						<div>
							<n-button v-if="loginFormData.userCode === '获取验证码'"
												type="success"
												@click="getCode"
							>{{loginFormData.userCode}}</n-button>
							<n-button v-else
												type="tertiary"
												disabled
							>{{loginFormData.userCode}}</n-button>
						</div>
					</div>

					<n-row :gutter="[0, 24]">
						<n-col :span="24">
							<div style="display: flex; justify-content: center;margin-top: 20px">
								<n-button
									type="primary"
									style="width: 100%"
									@click="onConfirmBtn"
								>
									{{ showForm === 'login' ? '登录' : '确认修改' }}
								</n-button>
							</div>
						</n-col>
					</n-row>
				</n-form>

				<div v-if="showForm === 'login'" style="display: flex; justify-content:space-between;margin-top: 20px">
					<div style="text-align:center;">海报扫码开通账号</div>
					<div style="text-align:center;cursor: pointer;" @click='onOpenRegisterOrClose("inRegister")'>忘记密码？</div>
				</div>
				<div style="height: 20px"></div>
			</n-card>
	</NModal>
</template>
