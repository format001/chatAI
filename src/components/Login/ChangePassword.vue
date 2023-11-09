<script setup lang="ts">
import {NButton, NInput, useMessage} from "naive-ui";
import {reactive} from "vue";
import {httpPost} from "@/utils/request/service";

	const emit = defineEmits(['update:show']);

	let state = reactive({
				originPassword: '',
				newPassword: '',
				confirmPassword: ''
		}),
		message = useMessage();

	async function onChangePassword() {
			await httpPost('/api/user/opRegister', {
										opassword: state.originPassword,
										password:	state.newPassword,
										repassword: state.confirmPassword
								}, {}, message);

				message.success('修改成功')
				emit('update:show', false)
	}


</script>

<template>
	<n-form ref="formRef2" :model="state">
		<div>原密码</div>
		<n-form-item path="opassword" label="原密码">
			<n-input v-model:value="state.originPassword" placeholder="请输入原密码"/>
		</n-form-item>


		<div style="margin-top:10px">新密码</div>
		<n-form-item path="password" label="新密码">
			<n-input
				v-model:value="state.newPassword"
				type="password"
				placeholder="请输入新密码"
			/>
		</n-form-item>

		<div style="margin-top:10px">确认新密码</div>
		<n-form-item path="repassword" label="确认新密码">
			<n-input
				v-model:value="state.confirmPassword"
				type="password"
				placeholder="请输入确认新密码"
			/>
		</n-form-item>

		<n-row :gutter="[0, 24]">
			<n-col :span="24">
				<div style="display: flex; justify-content: center;margin-top: 20px">
					<n-button
						type="primary"
						style="width: 100%"
						@click="onChangePassword"
					>
						修改密码
					</n-button>
				</div>
			</n-col>
		</n-row>
	</n-form>
	<div style="height: 30px"></div>
</template>

<style scoped>

</style>
