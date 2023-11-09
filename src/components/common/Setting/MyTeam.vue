<script setup lang="ts">

import {NList, NListItem, useMessage} from "naive-ui";
import {onActivated, onDeactivated, onMounted, reactive, toRefs} from "vue";

import { httpPost } from "@/utils/request/service";
import {useUserStore} from "@/store";

const useUser = useUserStore(),
			http_config = {
				headers: {'Authorization': 'Bearer '+ localStorage.getItem("user_token")}
			};

	let {
		recommendList,
		member_grade
	} = toRefs(reactive({
		recommendList: [],
		member_grade: {},
	}))

	onMounted(() => {
		getRecommendList()
	})

	//获取推荐用户
	async function getRecommendList() {
		let data = await httpPost('/api/user/getRecommendList', {
			"accout_type": 1
		}, http_config, useMessage());

		recommendList.value = data.data.data;
		member_grade.value = data.data.arr;
		let user = {
			count: recommendList.value.length,
		}
		useUser.updateUserInfo(user)
	}


</script>

<template>
	<img src="@/assets/f1.jpg"  />
	<NList style="height:100%; overflow-y: auto;width:100%;min-height:80vh">

		<NListItem  class="dei" style="width:100%;" >
			<div style="display:flex;justify-content:space-around;text-align:center;background:#3f6bf6;padding:10px 0px;color:#fff">
				<div >
					<div style="font-size:18px; font-weight: bold;">{{member_grade.key1 + member_grade.key2 +member_grade.key3 || 0}} </div>
					<div>直推会员</div>
				</div>

				<!--          <div >
										<div style="font-size:18px; font-weight: bold;">{{member_grade.key2}}</div>
										<div>高级会员</div>
									</div>  -->

				<div >
					<div style="font-size:18px; font-weight: bold;">{{member_grade.key3 || 0}}</div>
					<div>顶级会员</div>
				</div>
			</div>
		</NListItem>
		<NListItem v-for="(item, index) of recommendList" :key="index"  class="dei" style="width:100%" >
			<template #suffix>
				<div style="display:flex;justify-content: space-around;">
					<div style="width:100%" ><span style="padding-right:10px">V{{item.grade}}</span>{{item.nickname}}</div>
					<div style="width:100%;margin-top:5px">{{item.create_time}}</div>
				</div>
			</template>
		</NListItem>
	</NList>
</template>

<style scoped>

</style>
