<script setup lang="ts">
import { NButton, NDataTable, NList, NListItem, NModal, useMessage} from "naive-ui";
import type { DataTableColumns } from 'naive-ui'
import {useBasicLayout} from "@/hooks/useBasicLayout";
import {t} from "@/locales/index";
import {computed, h, onMounted, reactive, ref, toRefs} from "vue";
import {httpPost} from "@/utils/request/service";

interface DataProps {
	renderKey: string
	renderValue: string
	key: string
	value: string,
	id:string
}

	const props = defineProps({
		showModal2: {
			type: Boolean
		},
		pagination: {
			type: Object
		}
	}),
		emit = defineEmits(['play', 'update:showModal2']);

	const message = useMessage()

	const http_config = {
		headers: {'Authorization': 'Bearer ' + localStorage.getItem("user_token")}
	};

	const { isMobile } = useBasicLayout()
const columns = ((): DataTableColumns<DataProps> => {
	return [
		{
			title: '标题',
			width: 150,
			key: 'key',
		},
		{
			title: '描述',
			key: 'value',
		},
		{
			title: '操作',
			width: 100,
			render (row) {
				return h(
					NButton,
					{
						size: 'small',
						onClick: () => play(row)
					},
					{ default: () => '选用' }
				)
			}
		},
	]
})();


	let data = ref([])

	onMounted(() => {
		getSkillAll()
	})

		let show = computed({
			get() {
				return props.showModal2
			},
			set(value) {
				emit('update:showModal2', value)
			},
		})
	async function getSkillAll() {
		const skillAllData = await httpPost('/api/user/getSkillAll', {}, http_config, message);
		data.value = skillAllData.data;
	}

	function play(payload) {
		emit('play', payload)
	}
</script>

<template>
	<NModal v-model:show="show" style="width: 100%; max-width: 900px;" preset="card">
		<n-data-table
			v-if="!isMobile"
			:max-height="400"
			:columns="columns"
			:data="data"
			:pagination="props.pagination"
			:bordered="true"
		/>
			<NList v-if="isMobile" style="height:500px; overflow-y: auto;width:100%">
			<NListItem v-for="(item, index) in data" :key="index"  class="dei" style="
             width:100%" >
				<template #suffix>
					<div style="display: flex; justify-content: space-between;width:100%">
						<div style="font-weight: 600;width:80%" >{{item.renderKey}}</div>
						<div  class="">
							<NButton  size="small"   type="primary" @click="play(item)">选用</NButton>
						</div>
					</div>
					<div style="width:100%;margin-top:5px">{{item.renderValue}}</div>
				</template>
			</NListItem>
		</NList>
	</NModal>
</template>

<style scoped>
.dei{
	display: inline-block !important;

}
</style>
