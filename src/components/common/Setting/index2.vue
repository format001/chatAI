<script setup lang='ts'>
import {
	computed,
	ref,
	onMounted,
	reactive,
	toRefs,
	watch,
	onActivated,
	defineAsyncComponent, nextTick, onDeactivated
} from 'vue'
import { NButton, NInput,  NModal, NTabPane, NList, NListItem, NTabs,useMessage} from 'naive-ui'
import {   UserAvatar,SvgIcon } from '@/components/common'
import {useChatStore, usePromptStore, useUserStore} from '@/store'
import { httpPost } from "@/utils/request/service";



		const emit = defineEmits(['setModalState'])
const MyTeamComponent = defineAsyncComponent(() => {
	return import(/* webpackChunkName: "MyTeamComponent" */ '@/components/common/Setting/MyTeam.vue')
});

		const ms = useMessage(),
					http_config = {
							headers: {'Authorization': 'Bearer '+ localStorage.getItem("user_token")}
					};

		let {
			promotionQRDode,
			member_grade,
			money,
			hasAliPayName,
			hasAliPayAccount,
			profitList,
			vipGrade,
			user_fx_url,
			show,
			showVIPOrAlipay,
			recommendList,
			ModalShow,
			aliPayFormDate,
			isFirstIn,
			phone
		} = toRefs(reactive({
				show: true,
				promotionQRDode: null,
				member_grade: {},
				money: '0.00',  // 总收益
				hasAliPayName: '',
				hasAliPayAccount: '', // 用户信息 - 支付宝账户
				profitList: [],
				vipGrade: [ '直推会员', '顶级会员'],
				user_fx_url: '',
				ModalShow: false,
				showVIPOrAlipay: false,
				phone: '',
				recommendList: [],
				aliPayFormDate: {
					zfb_name: '',
					zfb_account: ''
				},
				isFirstIn: true
		}));

		onMounted(() => {
				getProfitList();
				handleSubmit();
		});



		onActivated(() => {
			getAdmin()
			show.value = true;
				if(!isFirstIn.value){
						if (hasAliPayName.value === '') {
							ModalShow.value = true;
						}
					}
				});
		onDeactivated(() => {
			isFirstIn.value = false;
		})

		watch(show, (newValue, oldValue) => {
			if (oldValue === true && newValue === false) {
				emit('setModalState', false)
			}
		});

	//获取月卡
	async function handleSubmit() {
		let data = await httpPost('/api/user/geterwm', {
			"accout_type": 1
		}, http_config,  ms);
		promotionQRDode.value = data.data.url
	}
	async function getAdmin() {
		const data = await httpPost('/api/user/get_admin', {	"accout_type": 1}, http_config, ms);

		hasAliPayName.value = data.data.zfb_name
		hasAliPayAccount.value = data.data.zfb_account
		phone.value = data.data.phone

		if (hasAliPayName.value === '') {
			ModalShow.value = true;
		}
	}

// 收益记录
	async function getProfitList() {
		ModalShow.value = false;
		let data = await httpPost('/api/user/getProfitList', {
			"accout_type": 1
		}, http_config, ms);

	profitList.value = data.data.data;
	user_fx_url.value = data.data.url;
	money.value = data.data.money
}
	async function handleValidateButtonClick2() {
		await httpPost('/api/user/bzfb', aliPayFormDate.value, http_config, ms);
		ms.success ('修改成功')
		hasAliPayName.value = aliPayFormDate.value.zfb_name

		ModalShow.value = false
	}

	async function onTopUser() {
		if (phone.value) {

			const data = await httpPost('/api/user/topUser', {
				phone: phone.value
			}, http_config, ms);
		window.location.href = data.data.from;
		}
	}

	function onShowVIPOrAlipay() {
			ModalShow.value = false
	}
</script>

<template>
		<NModal
			v-model:show="show"
			:auto-focus="false"
			z-index="998"
			preset="card"
			style="width: 95%;
			 max-width: 500px;
			 min-height:80vh">
			<n-card content-style="padding: 0;" >
				<n-tabs
					type="line"
					size="large"
					:tabs-padding="20"
					pane-style="padding: 20px 0px;"
				>
					<n-tab-pane name="推广海报">
						<div v-if="promotionQRDode" >
							<div style="display:flex;flex-wrap:wrap;justify-content:center">
								<img :src="promotionQRDode"  />
								<div @click="onTopUser">
									<img  src="@/assets/f4.png"  />
								</div>

							</div>
							<div  style="text-align: center;" >长按保存图片
								<!--	  <div style="padding-top:10px">长按保存图片</div>-->
							</div>
						</div>
						<div v-else style="text-align: center;padding-top:20px">
							暂无推广资格
						</div>
					</n-tab-pane>
					<n-tab-pane name="我的团队" >
						<keep-alive>
							 <MyTeamComponent />
						</keep-alive>
					</n-tab-pane>
					<n-tab-pane name="收益记录">

						<NList style="height:100%; overflow-y: auto;width:100%;min-height:80vh">
							<div style="text-align:center;font-size:24px;padding-bottom:20px">
								总收益：
								<span style="color:#18a058; font-weight: bold;">
														{{	money	}}
														</span>
							</div>
							<NListItem  class="dei" style="width:100%" >
								<div  style="display:flex;">
									<SvgIcon  class="text-2xl" icon="uiw:alipay" style=";color:#1777ff" />
									<div>  <span style="padding-right:10px;padding-left:5px">
																	结算支付宝账号:
																</span> {{ hasAliPayName }}   {{ hasAliPayAccount }}</div>
								</div>
							</NListItem>

							<NListItem v-for="(item, index) of profitList" :key="index"  class="dei" style="width:100%" >
								<template #suffix>
									<div style="display:flex;justify-content:space-between;">

										<div style="font-size:16px;">
											{{ item.nickname }}
										</div>

										<div style="font-size:16px;color:#18a058" >
											<span>+</span>
											{{ item.money }}元</div>
									</div>

									<div style="color:#999">{{ item.create_time }}</div>
								</template>
							</NListItem>
						</NList>
					</n-tab-pane>
				</n-tabs>
			</n-card>
		</NModal>

		<NModal v-model:show="ModalShow"   :mask-closable="false" @mask-click="onShowVIPOrAlipay" :z-index="999" style="width: 90%; max-width: 480px;background:#fff">
				<!--		支付宝信息-->
				<div style="background:#fff;width:90%;padding:60px">
					<n-card
						title="支付宝"
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
		</NModal>

</template>

<style>
.card_list{
    border:1px solid #18a058;padding:5px 25px;border-radius:5px;text-align: center;color:#18a058; margin-right: 10px;margin-top: 10px
}
.curr{
    border-color: red;
    color: red;
}
 .dei{
	 display: inline-block !important;

 }

</style>


















<!--<script setup lang='ts'>-->

<!--import QRCode from 'qrcodejs2-fixes';-->
<!--import { computed, ref,onMounted,nextTick} from 'vue'-->
<!--import { NButton, NInput,  NModal, NTabPane, NList, NListItem, NTabs,useMessage} from 'naive-ui'-->
<!--// import General from './General.vue'-->
<!--// import Advanced from './Advanced.vue'-->
<!--// import About from './About.vue'-->
<!--// import { useAuthStore } from '@/store'-->
<!--import {   UserAvatar,SvgIcon } from '@/components/common'-->
<!--import {useChatStore, usePromptStore, useUserStore} from '@/store'-->

<!--import axios from "axios";-->
<!--const ms = useMessage()-->
<!--//获取请求地址-->
<!--const VITE_APP_API=	import.meta.env.VITE_APP_API;-->

<!--const useUser = useUserStore();-->
<!--interface Props {-->
<!--  visible: boolean-->
<!--}-->

<!--interface Emit {-->
<!--  (e: 'update:visible', visible: boolean): void-->
<!--}-->

<!--const props = defineProps<Props>()-->

<!--const emit = defineEmits<Emit>()-->


<!--const active = ref(0)-->
<!--const order_id = ref();-->
<!--var pay_url = ref();-->

<!--const List = ref()-->
<!--const url = ref()-->
<!--const code = ref(0)-->


<!--const token = localStorage.getItem("user_token");-->
<!--const http_config = {-->
<!--	headers: {'Authorization': 'Bearer '+ token}-->
<!--};-->




<!--//获取月卡-->
<!--const  handleSubmit = async () => {-->
<!--	axios.post(VITE_APP_API+'/api/user/geterwm',{"accout_type":1},http_config).then(res=>{-->
<!--		if(res.status === 200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->

<!--				url.value=data.data.url-->
<!--			    code.value=data.data.code-->
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

<!--const recommendList=ref([]);-->
<!--const member_grade=ref([]);-->
<!--const user_fx_url=ref('');-->
<!--//获取推荐用户-->
<!--const  getRecommendList=()=> {-->
<!--	axios.post(VITE_APP_API+'/api/user/getRecommendList',{"accout_type":1},http_config).then(res=>{-->
<!--		if(res.status ==200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->
<!--		         recommendList.value=data.data.data;-->
<!--		         member_grade.value=data.data.arr-->
<!--		        	let user = {-->

<!--				        	count:recommendList.value.length ,-->

<!--				    }-->
<!--					useUser.updateUserInfo(user)-->
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

<!--const profitList=ref([]);-->
<!--const money=ref('0.00');-->
<!--const admin=ref({})-->
<!--const getProfitList=()=>{-->
<!--    	axios.post(VITE_APP_API+'/api/user/getProfitList',{"accout_type":1},http_config).then(res=>{-->
<!--		if(res.status ==200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->
<!--		         profitList.value=data.data.data;-->
<!--		         user_fx_url.value=data.data.url;-->

<!--		         money.value=data.data.money-->
<!--		         admin.value=data.data.admin-->
<!--		         if(admin.value.zfb_name==''){-->
<!--		             modifyModal.value=true-->
<!--		         }else{-->
<!--		             modifyModal.value=false;-->
<!--		         }-->


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

<!--onMounted(() => {-->
<!--	handleSubmit();-->
<!--	getRecommendList();-->
<!--	getProfitList();-->
<!--});-->

<!--const show = computed({-->
<!--  get() {-->
<!--    return props.visible-->
<!--  },-->
<!--  set(visible: boolean) {-->
<!--    emit('update:visible', visible)-->
<!--  },-->
<!--})-->


<!--const modifyModal=ref(false)-->
<!--const ModalShow=ref(false)-->
<!--const formValue2=ref({-->

<!--})-->

<!--const handleValidateButtonClick2 =()=>{-->
<!--    	axios.post(VITE_APP_API+'/api/user/bzfb',formValue2.value,http_config).then(res=>{-->
<!--		if(res.status ==200){-->
<!--			let data= res.data;-->
<!--			if(data.code ==200){-->
<!--		        	ms.success ('修改成功')-->
<!--		            getProfitList();-->
<!--		            modifyModal.value=false;-->
<!--		            ModalShow.value=true;-->
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
<!--function url_gb(){-->
<!--    ModalShow.value=false-->
<!--}-->

<!--function quitEvent() {-->
<!--	localStorage.clear()-->
<!--	location.reload()-->
<!--  }-->
<!--  function handleUpdateValue(value:string):void{-->
<!--	if(value == 'recharge'){-->
<!--		handleSubmit();-->
<!--	}-->
<!--  }-->
<!--</script>-->

<!--<template>-->
<!--  <NModal v-model:show="show" :auto-focus="false" z-index="998" preset="card" style="width: 95%; max-width: 500px;min-height:80vh">-->

<!--&lt;!&ndash;  <div v-if="code" >-->
<!--  <div style="display:flex;flex-wrap:wrap;justify-content:center">-->
<!--          <img :src="url"  />-->

<!--  </div>-->

<!--  <div  style="text-align: center;" >-->
<!--	  <div style="padding-top:10px">长按保存图片</div>-->
<!--  </div>-->
<!--</div>-->
<!--<div v-else style="text-align: center;padding-top:20px">-->
<!--    暂无推广资格-->
<!--</div>&ndash;&gt;-->


<!--<n-card content-style="padding: 0;" >-->

<!--    <n-tabs-->
<!--      type="line"-->
<!--      size="large"-->
<!--      :tabs-padding="20"-->
<!--      pane-style="padding: 20px 0px;"-->
<!--    >-->
<!--      <n-tab-pane name="推广海报">-->
<!--         <div v-if="code" >-->
<!--  <div style="display:flex;flex-wrap:wrap;justify-content:center">-->
<!--          <img :src="url"  />-->
<!--          <img src="@/assets/f3.jpg"  />-->

<!--  </div>-->

<!--  <div  style="text-align: center;" >-->
<!--&lt;!&ndash;	  <div style="padding-top:10px">长按保存图片</div>&ndash;&gt;-->
<!--  </div>-->
<!--</div>-->
<!--<div v-else style="text-align: center;padding-top:20px">-->
<!--    暂无推广资格-->
<!--</div>-->
<!--      </n-tab-pane>-->
<!--      <n-tab-pane name="我的团队">-->
<!--            <img src="@/assets/f1.jpg"  />-->
<!--          <NList style="height:100%; overflow-y: auto;width:100%;min-height:80vh">-->

<!--            <NListItem  class="dei" style="width:100%;" >-->
<!--                <div style="display:flex;justify-content:space-around;text-align:center;background:#3f6bf6;padding:10px 0px;color:#fff">-->
<!--                <div >-->
<!--                  <div style="font-size:18px; font-weight: bold;">{{member_grade.key1 + member_grade.key2 +member_grade.key3}}</div>-->
<!--                  <div>直推会员</div>-->
<!--                </div>-->

<!--      &lt;!&ndash;          <div >-->
<!--                  <div style="font-size:18px; font-weight: bold;">{{member_grade.key2}}</div>-->
<!--                  <div>高级会员</div>-->
<!--                </div>  &ndash;&gt;-->

<!--                <div >-->
<!--                  <div style="font-size:18px; font-weight: bold;">{{member_grade.key3}}</div>-->
<!--                  <div>顶级会员</div>-->
<!--                </div>-->
<!--                </div>-->
<!--            </NListItem>-->
<!--             <NListItem v-for="(item, index) of recommendList" :key="index"  class="dei" style="width:100%" >-->
<!--             <template #suffix>-->
<!--                <div style="display:flex;justify-content: space-around;">-->
<!--                <div style="width:100%" ><span style="padding-right:10px">V{{item.grade}}</span>{{item.nickname}}</div>-->
<!--                <div style="width:100%;margin-top:5px">{{item.create_time}}</div>-->
<!--                </div>-->
<!--              </template>-->
<!--            </NListItem>-->
<!--          </NList>-->


<!--      </n-tab-pane>-->
<!--       <n-tab-pane name="收益记录">-->

<!--          <NList style="height:100%; overflow-y: auto;width:100%;min-height:80vh">-->
<!--             <div style="text-align:center;font-size:24px;padding-bottom:20px">总收益：<span style="color:#18a058; font-weight: bold;">{{money}}</span></div>-->
<!--              <NListItem  class="dei" style="width:100%" >-->
<!--                <div  style="display:flex;">-->
<!--                    <SvgIcon  class="text-2xl" icon="uiw:alipay" style=";color:#1777ff" />-->
<!--                    <div>  <span style="padding-right:10px;padding-left:5px">  结算支付宝账号:</span> {{admin.zfb_name}}   {{admin.zfb_account}}</div>-->
<!--                </div>-->
<!--              </NListItem>-->

<!--             <NListItem v-for="(item, index) of profitList" :key="index"  class="dei" style="width:100%" >-->
<!--             <template #suffix>-->
<!--                <div style="display:flex;justify-content:space-between;">-->

<!--                <div style="font-size:16px;">{{item.nickname}}</div>-->

<!--                <div style="font-size:16px;color:#18a058" ><span>+</span>{{item.money}}元</div>-->
<!--                </div>-->

<!--                <div style="color:#999">{{item.create_time}}</div>-->
<!--              </template>-->
<!--            </NListItem>-->
<!--          </NList>-->
<!--      </n-tab-pane>-->
<!--    </n-tabs>-->
<!--  </n-card>-->


<!--  </NModal>-->



<!--		<NModal v-model:show="modifyModal"  :z-index="999" style="width: 90%; max-width: 480px;background:#fff">-->
<!--			<div style="background:#fff;width:90%;padding:60px">-->
<!--				<n-card-->
<!--					title="支付宝"-->
<!--					:bordered="false"-->
<!--					size="huge"-->
<!--					role="dialog"-->
<!--					aria-modal="true"-->
<!--				>-->


<!--                    <div style="color:red">完善支付宝信息，解锁推广权益</div>-->

<!--                  	<n-form>-->
<!--						<div style="margin-top:10px">真实姓名</div>-->
<!--						<n-form-item path="newpassword" label="">-->
<!--							<n-input-->
<!--								v-model:value="formValue2.zfb_name"-->

<!--								placeholder="请输入支付宝真实姓名"-->
<!--							/>-->
<!--						</n-form-item>-->

<!--						<div style="margin-top:10px">支付宝账号</div>-->
<!--						<n-form-item  >-->
<!--							<n-input-->
<!--								v-model:value="formValue2.zfb_account"-->

<!--								placeholder="请输入支付宝账号"-->
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
<!--										确认提交-->
<!--									</n-button>-->
<!--								</div>-->
<!--							</n-col>-->
<!--						</n-row>-->
<!--					</n-form>-->
<!--					<div style="height: 50px"></div>-->
<!--				</n-card>-->
<!--			</div>-->
<!--		</NModal>-->



<!--  	<NModal v-model:show="ModalShow"  :auto-focus="false" z-index="99999" preset="card" style="width: 95%; max-width: 500px;min-height:80vh">-->
<!--		 <img :src="user_fx_url"  style=""/>-->
<!--	</NModal>-->


<!--</template>-->

<!--<style>-->
<!--.card_list{-->
<!--	border:1px solid #18a058;padding:5px 25px;border-radius:5px;text-align: center;color:#18a058; margin-right: 10px;margin-top: 10px-->
<!--}-->
<!--.curr{-->
<!--	border-color: red;-->
<!--	color: red;-->
<!--}-->

<!--</style>-->
