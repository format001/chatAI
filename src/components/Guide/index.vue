<script setup lang="ts">
import {
	NButton, NInput,
	NModal, useMessage,
} from "naive-ui";
import {
	computed, onActivated, onMounted,
	reactive, toRefs, watch,
} from "vue";
import {httpPost} from "@/utils/request/service";


	const emit = defineEmits(['setModalState' ]),
				message = useMessage(),
			 token = localStorage.getItem("user_token");



let {
		step,
		guideImages,
		show,
		user_fx_url,
		hasAliPayName,
		showVIPOrAlipay,
		aliPayFormDate,
		showGuide,
		hasData
	} = toRefs(reactive({
			show: true,
			step: 1,
			guideImages: [{
					step: 1,
					image: new URL(`@/assets/v/v1.jpg`, import.meta.url).href
			},{
					step: 2,
				image: new URL(`@/assets/v/v2.jpg`, import.meta.url).href
			},{
					step: 3,
					image: new URL(`@/assets/v/v3.jpg`, import.meta.url).href
			},{
					step: 4,
					image: new URL(`@/assets/v/v4.jpg`, import.meta.url).href
			},{
					step: 5,
					image: new URL(`@/assets/v/v5.jpg`, import.meta.url).href
			}],
			user_fx_url: false,
			showGuide: true,
			hasAliPayName: false,
			showVIPOrAlipay: false,
			hasData: false,
			aliPayFormDate: {
				zfb_name: '',
				zfb_account: ''
			},
	}));

		const guideImagesSrc = computed(() => {
			return guideImages.value.filter(item => {
				if (item.step === step.value) {
					return true;
				}
			})[0].image;
		});

		onActivated(() => {
			getProfitList()

			show.value = true;
			showGuide.value = true;
			showVIPOrAlipay.value = false;
			step.value = 1;
		});

		watch(show, (newValue, oldValue) => {
			if (oldValue === true && newValue === false) {
					emit('setModalState', 'false')
			}
		});

	async function getProfitList() {
		if (token){
			let data = await httpPost('/api/user/get_admin', {
				"accout_type": 1
			}, {
				headers: {'Authorization': 'Bearer '+ token}
			}, message);

			hasData.value = true;
			user_fx_url.value = data.data.url;
			hasAliPayName.value = data.data.zfb_name

		}
}

		function chatout_img() {
					step.value ++;

				if (step.value >= 6) {
					showGuide.value = false;

					if (token && hasData.value ){
						if (hasAliPayName.value) {
							showVIPOrAlipay.value = 'VIP'
						}else{
							showVIPOrAlipay.value = 'alipay'
						}
					}else {
						show.value = false
					}
				}
		}
		function onVipCcertificate() {
			show.value = false
		}

	async function handleValidateButtonClick2() {
		let token = localStorage.getItem("user_token");
		await httpPost('/api/user/bzfb', aliPayFormDate.value, {
			headers: {'Authorization': 'Bearer '+ token}
		}, message);
		message.success ('修改成功')
		hasAliPayName.value = aliPayFormDate.value.zfb_name
		showVIPOrAlipay.value = 'VIP'
	}
	function maskClick() {
			if (showGuide.value){
				chatout_img();
			}else if (token){
				show.value = false;
			}
	}

</script>

<template>
    <NModal v-model:show="show" @maskClick="maskClick"
						:mask-closable="false"
						style="width:100%; max-width: 540px">
			<div>
				<div @click="chatout_img" v-if="showGuide">
					<img :src="guideImagesSrc"  />
				</div>
				<div v-if="showVIPOrAlipay === 'alipay'" 	class="alipay-box">
					<n-card title="支付宝"
									:bordered="false"
									size="huge"
									role="dialog"
									aria-modal="true"
					>
						<div style="color:red">完善支付宝信息，解锁推广权益</div>
						<n-form>
							<div style="margin-top:10px">真实姓名</div>
							<n-form-item path="newpassword" label="">
								<n-input
									v-model:value="aliPayFormDate.zfb_name"

									placeholder="请输入支付宝真实姓名"
								/>
							</n-form-item>

							<div style="margin-top:10px">支付宝账号</div>
							<n-form-item  >
								<n-input
									v-model:value="aliPayFormDate.zfb_account"

									placeholder="请输入支付宝账号"
								/>
							</n-form-item>

							<n-row :gutter="[0, 24]">
								<n-col :span="24">
									<div style="display: flex; justify-content: center;margin-top: 20px">
										<n-button
											type="primary"
											style="width: 100%"
											@click="handleValidateButtonClick2"
										>
											确认提交
										</n-button>
									</div>
								</n-col>
							</n-row>
						</n-form>
						<div style="height: 50px"></div>
					</n-card>
				</div>
				<div @click="onVipCcertificate" v-show="showVIPOrAlipay === 'VIP'">
					<img :src="user_fx_url"  />
				</div>
			</div>
		</NModal>
</template>

<style scoped>
.alipay-box{
	margin: 0 auto;
	background:#fff;
	width:90%;
	padding:60px
}
</style>
