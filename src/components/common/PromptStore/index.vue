<script setup lang='ts'>
import type { DataTableColumns } from 'naive-ui'
import {
	computed, h, ref, watch,
	onMounted,
	onActivated, inject, onDeactivated, onUnmounted
} from 'vue'
import { NButton, NCard, NDataTable, NDivider, NInput, NList, NListItem, NModal, NPopconfirm, NSpace, NTabPane, NTabs, NThing, useMessage,useDialog } from 'naive-ui'
import PromptRecommend from '../../../assets/recommend.json'
import { usePromptStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'
import {httpPost} from "@/utils/request/service";
import OfficialPrompt from "@/components/common/PromptStore/OfficialPrompt.vue";

//获取请求地址
interface DataProps {
  renderKey: string
  renderValue: string
  key: string
  value: string,
  id:string
}

const emit = defineEmits(['setModalState'])

const message = useMessage()
const http_config = {
	headers: {'Authorization': 'Bearer ' + localStorage.getItem("user_token")}
};


const showModal = ref(false)
const showModal2 = ref(false)

const importLoading = ref(false)
const exportLoading = ref(false)

const searchValue = ref<string>('')

// 移动端自适应相关
const { isMobile } = useBasicLayout()

const promptStore = usePromptStore()

// Prompt在线导入推荐List,根据部署者喜好进行修改(assets/recommend.json)
const promptRecommendList = PromptRecommend
const promptList = ref<any>(promptStore.promptList)

// 用于添加修改的临时prompt参数
const tempPromptKey = ref('')
const tempPromptValue = ref('')
const tempPromptId = ref('')

// Modal模式，根据不同模式渲染不同的Modal内容
const modalMode = ref('')

// 这个是为了后期的修改Prompt内容考虑，因为要针对无uuid的list进行修改，且考虑到不能出现标题和内容的冲突，所以就需要一个临时item来记录一下
const tempModifiedItem = ref<any>({})

// 添加修改导入都使用一个Modal, 临时修改内容占用tempPromptKey,切换状态前先将内容都清楚
const changeShowModal = (mode: 'add' | 'modify' | 'local_import', selected = { key: '', value: '' }) => {
  if (mode === 'add') {
    tempPromptKey.value = ''
    tempPromptValue.value = ''
    tempPromptId.value=''
  }
  else if (mode === 'modify') {
    tempModifiedItem.value = { ...selected }
    tempPromptKey.value = selected.key
    tempPromptValue.value = selected.value
      tempPromptId.value=selected.id
  }
  showModal.value = !showModal.value
  modalMode.value = mode
}

// 在线导入相关
const downloadURL = ref('')


// 控制 input 按钮
	const inputStatus = computed (() => tempPromptKey.value.trim().length < 1 || tempPromptValue.value.trim().length < 1)

// Prompt模板相关操作
	async function addPromptTemplate() {
		await httpPost('/api/user/skill_add', {
			 id: tempPromptId.value,
			label: tempPromptKey.value,
			value: tempPromptValue.value
		}, http_config, message);

        getList();
        message.success('成功')
        showModal.value = false;
	}

	const modifyPromptTemplate = () => {
  let index = 0

  // 通过临时索引把待修改项摘出来
  for (const i of promptList.value) {
    if (i.key === tempModifiedItem.value.key && i.value === tempModifiedItem.value.value)
      break
    index = index + 1
  }

  const tempList = promptList.value.filter((_: any, i: number) => i !== index)

  // 搜索有冲突的部分
  for (const i of tempList) {
    if (i.key === tempPromptKey.value) {
      message.error(t('store.editRepeatTitleTips'))
      return
    }
    if (i.value === tempPromptValue.value) {
      message.error(t('store.editRepeatContentTips', { msg: i.key }))
      return
    }
  }

  promptList.value = [{ key: tempPromptKey.value, value: tempPromptValue.value }, ...tempList] as never
  message.success(t('common.editSuccess'))
  changeShowModal('modify')
}

	const dialog = useDialog()

	async function deletePromptTemplate(row) {
		dialog.warning({
			title: '警告',
			content: '你确定？',
			positiveText: '确定',
			negativeText: '取消',
			onPositiveClick: async () => {
					await httpPost('/api/user/skillDoDelete', {
											ids: row.id
									}, http_config, message);

				promptList.value = promptList.value.filter(item => {
					return item.id !== row.id;
				})
                message.success('删除成功')
			},
			onNegativeClick: () => {

			}
		})
	}

const importPromptTemplate = (from = 'online') => {
  try {
    const jsonData = JSON.parse(tempPromptValue.value)
    let key = ''
    let value = ''
    // 可以扩展加入更多模板字典的key
    if ('key' in jsonData[0]) {
      key = 'key'
      value = 'value'
    }
    else if ('act' in jsonData[0]) {
      key = 'act'
      value = 'prompt'
    }
    else {
      // 不支持的字典的key防止导入 以免破坏prompt商店打开
      message.warning('prompt key not supported.')
      throw new Error('prompt key not supported.')
    }

    for (const i of jsonData) {
      if (!(key in i) || !(value in i))
        throw new Error(t('store.importError'))
      let safe = true
      for (const j of promptList.value) {
        if (j.key === i[key]) {
          message.warning(t('store.importRepeatTitle', { msg: i[key] }))
          safe = false
          break
        }
        if (j.value === i[value]) {
          message.warning(t('store.importRepeatContent', { msg: i[key] }))
          safe = false
          break
        }
      }
      if (safe)
        promptList.value.unshift({ key: i[key], value: i[value] } as never)
    }
    message.success(t('common.importSuccess'))
  }
  catch {
    message.error('JSON 格式错误，请检查 JSON 格式')
  }
  if (from === 'local')
    showModal.value = !showModal.value
}

// 模板导出
const exportPromptTemplate = () => {
  exportLoading.value = true
  const jsonDataStr = JSON.stringify(promptList.value)
  const blob = new Blob([jsonDataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ChatGPTPromptTemplate.json'
  link.click()
  URL.revokeObjectURL(url)
  exportLoading.value = false
}

// 模板在线导入
const downloadPromptTemplate = async () => {
  try {
    importLoading.value = true
    const response = await fetch(downloadURL.value)
    const jsonData = await response.json()
    if ('key' in jsonData[0] && 'value' in jsonData[0])
      tempPromptValue.value = JSON.stringify(jsonData)
    if ('act' in jsonData[0] && 'prompt' in jsonData[0]) {
      const newJsonData = jsonData.map((item: { act: string; prompt: string }) => {
        return {
          key: item.act,
          value: item.prompt,
        }
      })
      tempPromptValue.value = JSON.stringify(newJsonData)
    }
    importPromptTemplate()
    downloadURL.value = ''
  }
  catch {
    message.error(t('store.downloadError'))
    downloadURL.value = ''
  }
  finally {
    importLoading.value = false
  }
}

// 移动端自适应相关
const renderTemplate = () => {
  const [keyLimit, valueLimit] = isMobile.value ? [10, 30] : [15, 50]

  return promptList.value.map((item: { key: string; value: string }) => {
    return {
      renderKey: item.key.length <= keyLimit ? item.key : `${item.key.substring(0, keyLimit)}...`,
      renderValue: item.value.length <= valueLimit ? item.value : `${item.value.substring(0, valueLimit)}...`,
      key: item.key,
      value: item.value,
      id:item.id
    }
  })
}

const pagination = computed(() => {
  const [pageSize, pageSlot] = isMobile.value ? [6, 5] : [7, 15]
  return {
    pageSize, pageSlot,
  }
})

// table相关
const columns = ((): DataTableColumns<DataProps> => {
    return [
        {
            title: t('store.title'),
            key: 'renderKey',
        },
        {
            title: t('store.description'),
            key: 'renderValue',
        },
        {
            title: t('common.action'),
            key: 'actions',
            width: 100,
            align: 'center',
            render(row) {
                return h('div', { class: 'flex items-center flex-col gap-2' }, {
                    default: () => [h(
                        NButton,
                        {
                            tertiary: true,
                            size: 'small',
                            type: 'info',
                            onClick: () => changeShowModal('modify', row),
                        },
                        { default: () => t('common.edit') },
                    ),
                        h(
                            NButton,
                            {
                                tertiary: true,
                                size: 'small',
                                type: 'error',
                                onClick: () => deletePromptTemplate(row),
                            },
                            { default: () => t('common.delete') },
                        ),
                    ],
                })
            },
        },
    ]
})();

watch(
  () => promptList,
  () => {
    promptStore.updatePromptList(promptList.value)
  },
  { deep: true },
)

const dataSource = computed( () => {
  const data = renderTemplate()
  const value = searchValue.value
  if (value && value !== '') {
    return data.filter((item: DataProps) => {
      return item.renderKey.includes(value) || item.renderValue.includes(value)
    })
  }
  return data
})

	let show = ref(true)

	watch(show, (newValue, oldValue) => {
		if (oldValue === true && newValue === false) {
			emit('setModalState', false)
		}
	});
	onActivated(() => {
		show.value = true
	})

	onMounted( ()=>{
			getList()
		})

	async function getList() {
			const data = await httpPost('/api/user/skill_list', {}, http_config, message);
			promptList.value = data.data.list;
	}

	async function gf() {
        showModal2.value = true
    }

	/*
	* 选用官方Prompt提示词
	* */
    async function play(row) {
        await httpPost('/api/user/skill_add', {
            id: '',
            label: row.key,
            value: row.value
        }, http_config, message);

        getList();
        message.success('选用成功');
    }

</script>

<template>
		<NModal v-model:show="show"
						style="width: 90%; max-width: 900px;" preset="card">
			<div class="space-y-4">
				<div
					class="flex gap-3 mb-4"
					:class="[isMobile ? 'flex-col' : 'flex-row justify-between']"
				>
					<div class="flex items-center space-x-4">
						<NButton
							type="primary"
							size="small"
							@click="changeShowModal('add')"
						>
							添加（自定义@提示词）
						</NButton>

						<NButton
							type="primary"
							size="small"
							@click="gf()"
						>
							官方提示词
						</NButton>

					</div>

				</div>
				<NDataTable
					v-if="!isMobile"
					:max-height="400"
					:columns="columns"
					:data="dataSource"
					:pagination="pagination"
					:bordered="false"
				/>
				<NList v-if="isMobile" style="max-height: 400px; overflow-y: auto;">
					<NListItem v-for="(item, index) of dataSource" :key="index">
						<NThing :title="item.renderKey" :description="item.renderValue" />
						<template #suffix>
							<div class="flex flex-col items-center gap-2">
								<NButton size="small" type="primary" @click="changeShowModal('modify', item)">
									编辑
								</NButton>
								<NButton tertiary size="small" type="error" @click="deletePromptTemplate(item)">
									删除
								</NButton>
							</div>
						</template>
					</NListItem>
				</NList>
			</div>
		</NModal>

		<NModal v-model:show="showModal" style="width: 90%; max-width: 600px;" preset="card">
			<NSpace v-if="modalMode === 'add' || modalMode === 'modify'" vertical>
				提示词标题
				<NInput v-model:value="tempPromptKey"  placeholder="请输入提示词标题，以便请输入快速查找"/>
				提示词描述
				<NInput v-model:value="tempPromptValue" type="textarea"  placeholder="根据你的需要，自定义提示词内容，参考公式“角色+问题+要求”"/>
				<NButton
					block
					type="primary"
					:disabled="inputStatus"
					@click="addPromptTemplate()"
				>
					确定
				</NButton>
			</NSpace>

		</NModal>

		<keep-alive>
			<div v-if="showModal2">
				<OfficialPrompt
					:pagination="pagination"
					v-model:showModal2="showModal2"
					@play="play"/>
			</div>
		</keep-alive>


</template>


























<!--<script setup lang='ts'>-->
<!--import type { DataTableColumns } from 'naive-ui'-->
<!--import { computed, h, ref, watch,-->
<!--	onMounted,-->
<!--	onActivated-->
<!--} from 'vue'-->
<!--import { NButton, NCard, NDataTable, NDivider, NInput, NList, NListItem, NModal, NPopconfirm, NSpace, NTabPane, NTabs, NThing, useMessage,useDialog } from 'naive-ui'-->
<!--import PromptRecommend from '../../../assets/recommend.json'-->
<!--import { SvgIcon } from '..'-->
<!--import { usePromptStore } from '@/store'-->
<!--import { useBasicLayout } from '@/hooks/useBasicLayout'-->
<!--import { t } from '@/locales'-->
<!--import axios from "axios";-->
<!--import {httpPost} from "@/utils/request/service";-->



<!--//获取请求地址-->
<!--const VITE_APP_API = import.meta.env.VITE_APP_API;-->
<!--interface DataProps {-->
<!--	renderKey: string-->
<!--	renderValue: string-->
<!--	key: string-->
<!--	value: string,-->
<!--	id:string-->
<!--}-->

<!--interface Props {-->
<!--	visible: boolean-->
<!--}-->


<!--interface Emit {-->
<!--	(e: 'update:visible', visible: boolean): void-->
<!--}-->

<!--const props = defineProps<Props>()-->

<!--const emit = defineEmits<Emit>()-->

<!--const message = useMessage()-->

<!--const token = localStorage.getItem("user_token");-->
<!--const http_config = {-->
<!--	headers: {'Authorization': 'Bearer ' + token}-->
<!--};-->


<!--const show = computed({-->
<!--	get: () => props.visible,-->
<!--	set: (visible: boolean) => emit('update:visible', visible),-->
<!--})-->

<!--const showModal = ref(false)-->
<!--const showModal2 = ref(false)-->

<!--const importLoading = ref(false)-->
<!--const exportLoading = ref(false)-->

<!--const searchValue = ref<string>('')-->

<!--// 移动端自适应相关-->
<!--const { isMobile } = useBasicLayout()-->

<!--const promptStore = usePromptStore()-->

<!--// Prompt在线导入推荐List,根据部署者喜好进行修改(assets/recommend.json)-->
<!--const promptRecommendList = PromptRecommend-->
<!--const promptList = ref<any>(promptStore.promptList)-->

<!--// 用于添加修改的临时prompt参数-->
<!--const tempPromptKey = ref('')-->
<!--const tempPromptValue = ref('')-->
<!--const tempPromptId = ref('')-->

<!--// Modal模式，根据不同模式渲染不同的Modal内容-->
<!--const modalMode = ref('')-->

<!--// 这个是为了后期的修改Prompt内容考虑，因为要针对无uuid的list进行修改，且考虑到不能出现标题和内容的冲突，所以就需要一个临时item来记录一下-->
<!--const tempModifiedItem = ref<any>({})-->

<!--// 添加修改导入都使用一个Modal, 临时修改内容占用tempPromptKey,切换状态前先将内容都清楚-->
<!--const changeShowModal = (mode: 'add' | 'modify' | 'local_import', selected = { key: '', value: '' }) => {-->
<!--	if (mode === 'add') {-->
<!--		tempPromptKey.value = ''-->
<!--		tempPromptValue.value = ''-->
<!--		tempPromptId.value=''-->
<!--	}-->
<!--	else if (mode === 'modify') {-->

<!--		tempModifiedItem.value = { ...selected }-->
<!--		tempPromptKey.value = selected.key-->
<!--		tempPromptValue.value = selected.value-->
<!--		tempPromptId.value=selected.id-->
<!--	}-->
<!--	showModal.value = !showModal.value-->
<!--	modalMode.value = mode-->
<!--}-->

<!--// 在线导入相关-->
<!--const downloadURL = ref('')-->
<!--const downloadDisabled = computed(() => downloadURL.value.trim().length < 1)-->
<!--const setDownloadURL = (url: string) => {-->
<!--	downloadURL.value = url-->
<!--}-->

<!--// 控制 input 按钮-->
<!--const inputStatus = computed (() => tempPromptKey.value.trim().length < 1 || tempPromptValue.value.trim().length < 1)-->

<!--// Prompt模板相关操作-->

<!--const addPromptTemplate = () => {-->


<!--	axios.post(VITE_APP_API + '/api/user/skill_add',  { id:tempPromptId.value,label: tempPromptKey.value, value: tempPromptValue.value }, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				getList();-->

<!--				message.success('成功')-->
<!--				changeShowModal('add')-->
<!--			} else if (data.code == 401) {-->
<!--				localStorage.setItem('user_token','')-->
<!--				message.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				message.error(data.msg)-->
<!--			} else {-->
<!--				message.error('网络错误！')-->
<!--			}-->
<!--		} else {-->
<!--			message.error('网络错误！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		message.error('网络错误！')-->
<!--	})-->



<!--	/*-->
<!--	 message.success(t('common.addSuccess'))-->
<!--	 changeShowModal('add')*/-->
<!--}-->


<!--const modifyPromptTemplate = () => {-->
<!--	let index = 0-->

<!--	// 通过临时索引把待修改项摘出来-->
<!--	for (const i of promptList.value) {-->
<!--		if (i.key === tempModifiedItem.value.key && i.value === tempModifiedItem.value.value)-->
<!--			break-->
<!--		index = index + 1-->
<!--	}-->

<!--	const tempList = promptList.value.filter((_: any, i: number) => i !== index)-->

<!--	// 搜索有冲突的部分-->
<!--	for (const i of tempList) {-->
<!--		if (i.key === tempPromptKey.value) {-->
<!--			message.error(t('store.editRepeatTitleTips'))-->
<!--			return-->
<!--		}-->
<!--		if (i.value === tempPromptValue.value) {-->
<!--			message.error(t('store.editRepeatContentTips', { msg: i.key }))-->
<!--			return-->
<!--		}-->
<!--	}-->

<!--	promptList.value = [{ key: tempPromptKey.value, value: tempPromptValue.value }, ...tempList] as never-->
<!--	message.success(t('common.editSuccess'))-->
<!--	changeShowModal('modify')-->
<!--}-->

<!--const dialog = useDialog()-->
<!--const deletePromptTemplate = (row) => {-->


<!--	dialog.warning({-->
<!--		title: '警告',-->
<!--		content: '你确定？',-->
<!--		positiveText: '确定',-->
<!--		negativeText: '取消',-->
<!--		onPositiveClick: () => {-->
<!--			const token = localStorage.getItem("user_token");-->
<!--			const http_config = {-->
<!--				headers: {'Authorization': 'Bearer ' + token}-->
<!--			};-->

<!--			axios.post(VITE_APP_API + '/api/user/skillDoDelete', {ids:row.id}, http_config).then(res=>{-->
<!--				getList()-->
<!--				message.success(t('common.deleteSuccess'))-->
<!--			}).catch(error=>{-->
<!--				message.error('失败')-->
<!--			})-->
<!--		},-->
<!--		onNegativeClick: () => {-->

<!--		}-->
<!--	})-->



<!--}-->

<!--const clearPromptTemplate = () => {-->
<!--	promptList.value = []-->
<!--	message.success(t('common.clearSuccess'))-->
<!--}-->

<!--const importPromptTemplate = (from = 'online') => {-->
<!--	try {-->
<!--		const jsonData = JSON.parse(tempPromptValue.value)-->
<!--		let key = ''-->
<!--		let value = ''-->
<!--		// 可以扩展加入更多模板字典的key-->
<!--		if ('key' in jsonData[0]) {-->
<!--			key = 'key'-->
<!--			value = 'value'-->
<!--		}-->
<!--		else if ('act' in jsonData[0]) {-->
<!--			key = 'act'-->
<!--			value = 'prompt'-->
<!--		}-->
<!--		else {-->
<!--			// 不支持的字典的key防止导入 以免破坏prompt商店打开-->
<!--			message.warning('prompt key not supported.')-->
<!--			throw new Error('prompt key not supported.')-->
<!--		}-->

<!--		for (const i of jsonData) {-->
<!--			if (!(key in i) || !(value in i))-->
<!--				throw new Error(t('store.importError'))-->
<!--			let safe = true-->
<!--			for (const j of promptList.value) {-->
<!--				if (j.key === i[key]) {-->
<!--					message.warning(t('store.importRepeatTitle', { msg: i[key] }))-->
<!--					safe = false-->
<!--					break-->
<!--				}-->
<!--				if (j.value === i[value]) {-->
<!--					message.warning(t('store.importRepeatContent', { msg: i[key] }))-->
<!--					safe = false-->
<!--					break-->
<!--				}-->
<!--			}-->
<!--			if (safe)-->
<!--				promptList.value.unshift({ key: i[key], value: i[value] } as never)-->
<!--		}-->
<!--		message.success(t('common.importSuccess'))-->
<!--	}-->
<!--	catch {-->
<!--		message.error('JSON 格式错误，请检查 JSON 格式')-->
<!--	}-->
<!--	if (from === 'local')-->
<!--		showModal.value = !showModal.value-->
<!--}-->

<!--// 模板导出-->
<!--const exportPromptTemplate = () => {-->
<!--	exportLoading.value = true-->
<!--	const jsonDataStr = JSON.stringify(promptList.value)-->
<!--	const blob = new Blob([jsonDataStr], { type: 'application/json' })-->
<!--	const url = URL.createObjectURL(blob)-->
<!--	const link = document.createElement('a')-->
<!--	link.href = url-->
<!--	link.download = 'ChatGPTPromptTemplate.json'-->
<!--	link.click()-->
<!--	URL.revokeObjectURL(url)-->
<!--	exportLoading.value = false-->
<!--}-->

<!--// 模板在线导入-->
<!--const downloadPromptTemplate = async () => {-->
<!--	try {-->
<!--		importLoading.value = true-->
<!--		const response = await fetch(downloadURL.value)-->
<!--		const jsonData = await response.json()-->
<!--		if ('key' in jsonData[0] && 'value' in jsonData[0])-->
<!--			tempPromptValue.value = JSON.stringify(jsonData)-->
<!--		if ('act' in jsonData[0] && 'prompt' in jsonData[0]) {-->
<!--			const newJsonData = jsonData.map((item: { act: string; prompt: string }) => {-->
<!--				return {-->
<!--					key: item.act,-->
<!--					value: item.prompt,-->
<!--				}-->
<!--			})-->
<!--			tempPromptValue.value = JSON.stringify(newJsonData)-->
<!--		}-->
<!--		importPromptTemplate()-->
<!--		downloadURL.value = ''-->
<!--	}-->
<!--	catch {-->
<!--		message.error(t('store.downloadError'))-->
<!--		downloadURL.value = ''-->
<!--	}-->
<!--	finally {-->
<!--		importLoading.value = false-->
<!--	}-->
<!--}-->

<!--// 移动端自适应相关-->
<!--const renderTemplate = () => {-->
<!--	const [keyLimit, valueLimit] = isMobile.value ? [10, 30] : [15, 50]-->

<!--	return promptList.value.map((item: { key: string; value: string }) => {-->
<!--		return {-->
<!--			renderKey: item.key.length <= keyLimit ? item.key : `${item.key.substring(0, keyLimit)}...`,-->
<!--			renderValue: item.value.length <= valueLimit ? item.value : `${item.value.substring(0, valueLimit)}...`,-->
<!--			key: item.key,-->
<!--			value: item.value,-->
<!--			id:item.id-->
<!--		}-->
<!--	})-->
<!--}-->

<!--const pagination = computed(() => {-->
<!--	const [pageSize, pageSlot] = isMobile.value ? [6, 5] : [7, 15]-->
<!--	return {-->
<!--		pageSize, pageSlot,-->
<!--	}-->
<!--})-->

<!--// table相关-->
<!--const createColumns = (): DataTableColumns<DataProps> => {-->
<!--	return [-->
<!--		{-->
<!--			title: t('store.title'),-->
<!--			key: 'renderKey',-->
<!--		},-->
<!--		{-->
<!--			title: t('store.description'),-->
<!--			key: 'renderValue',-->
<!--		},-->
<!--		{-->
<!--			title: t('common.action'),-->
<!--			key: 'actions',-->
<!--			width: 100,-->
<!--			align: 'center',-->
<!--			render(row) {-->
<!--				return h('div', { class: 'flex items-center flex-col gap-2' }, {-->
<!--					default: () => [h(-->
<!--						NButton,-->
<!--						{-->
<!--							tertiary: true,-->
<!--							size: 'small',-->
<!--							type: 'info',-->
<!--							onClick: () => changeShowModal('modify', row),-->
<!--						},-->
<!--						{ default: () => t('common.edit') },-->
<!--					),-->
<!--						h(-->
<!--							NButton,-->
<!--							{-->
<!--								tertiary: true,-->
<!--								size: 'small',-->
<!--								type: 'error',-->
<!--								onClick: () => deletePromptTemplate(row),-->
<!--							},-->
<!--							{ default: () => t('common.delete') },-->
<!--						),-->
<!--					],-->
<!--				})-->
<!--			},-->
<!--		},-->
<!--	]-->
<!--}-->

<!--const columns = createColumns()-->

<!--watch(-->
<!--	() => promptList,-->
<!--	() => {-->

<!--		promptStore.updatePromptList(promptList.value)-->
<!--	},-->
<!--	{ deep: true },-->
<!--)-->

<!--const dataSource = computed( () => {-->
<!--	const data = renderTemplate()-->
<!--	const value = searchValue.value-->
<!--	if (value && value !== '') {-->
<!--		return data.filter((item: DataProps) => {-->
<!--			return item.renderKey.includes(value) || item.renderValue.includes(value)-->
<!--		})-->
<!--	}-->
<!--	return data-->
<!--})-->
<!--console.log(pagination)-->
<!--onActivated( ()=>{-->
<!--	getList()-->
<!--})-->

<!--async function getList() {-->
<!--	const data = await httpPost('/api/user/skill_list', {}, http_config, message);-->
<!--	promptList.value = data.data.data.list;-->
<!--}-->



<!--const data2 = ref(true)-->
<!--const createColumns2 = (): DataTableColumns<DataProps> => {-->
<!--	return [-->
<!--		{-->
<!--			title: t('store.title'),-->
<!--			width: 150,-->
<!--			key: 'key',-->
<!--		},-->
<!--		{-->
<!--			title: t('store.description'),-->
<!--			key: 'value',-->
<!--		},-->
<!--		{-->
<!--			title: t('common.action'),-->
<!--			width: 100,-->
<!--			render (row) {-->
<!--				return h(-->
<!--					NButton,-->
<!--					{-->
<!--						size: 'small',-->
<!--						onClick: () => play(row)-->
<!--					},-->
<!--					{ default: () => '选用' }-->
<!--				)-->
<!--			}-->


<!--		},-->
<!--	]-->
<!--}-->


<!--const columns2 = createColumns2()-->
<!--const gf =()=>{-->

<!--	let token = localStorage.getItem("user_token");-->
<!--	let http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->

<!--	axios.post(VITE_APP_API + '/api/user/getSkillAll', {}, http_config).then(res=>{-->
<!--		let data =res.data.data;-->
<!--		showModal2.value=true-->
<!--		data2.value=data;-->

<!--	}).catch(error=>{-->

<!--	})-->

<!--}-->

<!--/*选中*/-->
<!--const play =(row)=>{-->
<!--	tempPromptId.value='';-->
<!--	tempPromptKey.value=row.key;-->
<!--	tempPromptValue.value=row.value;-->
<!--	addPromptTemplate2();-->
<!--	//   showModal2.value=false-->
<!--	/*    addPromptTemplate();-->
<!--			showModal2.value=false-->
<!--			showModal.value=false*/-->
<!--}-->

<!--// Prompt模板相关操作-->
<!--const addPromptTemplate2 = () => {-->
<!--	const token = localStorage.getItem("user_token");-->
<!--	const http_config = {-->
<!--		headers: {'Authorization': 'Bearer ' + token}-->
<!--	};-->

<!--	axios.post(VITE_APP_API + '/api/user/skill_add',  { id:tempPromptId.value,label: tempPromptKey.value, value: tempPromptValue.value }, http_config).then(res => {-->
<!--		if (res.status == 200) {-->
<!--			let data = res.data;-->
<!--			if (data.code == 200) {-->
<!--				getList();-->
<!--				message.success('选用成功');-->
<!--			} else if (data.code == 401) {-->
<!--				localStorage.setItem('user_token','')-->
<!--				message.error('登录已失效！')-->
<!--				localStorage.clear()-->
<!--			} else if (data.code == 400) {-->
<!--				message.error(data.msg)-->
<!--			} else {-->
<!--				message.error('网络错误！')-->
<!--			}-->
<!--		} else {-->
<!--			message.error('网络错误！')-->
<!--		}-->
<!--	}).catch(error => {-->
<!--		message.error('网络错误！')-->
<!--	})-->

<!--}-->

<!--</script>-->

<!--<template>-->
<!--	<keep-alive>-->
<!--		<div v-if="show">-->

<!--		</div>-->

<!--	</keep-alive>-->
<!--	<NModal v-model:show="show" style="width: 90%; max-width: 900px;" preset="card">-->
<!--		<div class="space-y-4">-->
<!--			<div-->
<!--				class="flex gap-3 mb-4"-->
<!--				:class="[isMobile ? 'flex-col' : 'flex-row justify-between']"-->
<!--			>-->
<!--				<div class="flex items-center space-x-4">-->
<!--					<NButton-->
<!--						type="primary"-->
<!--						size="small"-->
<!--						@click="changeShowModal('add')"-->
<!--					>-->
<!--						添加（自定义@提示词）-->
<!--					</NButton>-->

<!--					<NButton-->
<!--						type="primary"-->
<!--						size="small"-->
<!--						@click="gf()"-->
<!--					>-->
<!--						官方提示词-->
<!--					</NButton>-->

<!--				</div>-->

<!--			</div>-->
<!--			<NDataTable-->
<!--				v-if="!isMobile"-->
<!--				:max-height="400"-->
<!--				:columns="columns"-->
<!--				:data="dataSource"-->
<!--				:pagination="pagination"-->
<!--				:bordered="false"-->
<!--			/>-->
<!--			<NList v-if="isMobile" style="max-height: 400px; overflow-y: auto;">-->
<!--				<NListItem v-for="(item, index) of dataSource" :key="index">-->
<!--					<NThing :title="item.renderKey" :description="item.renderValue" />-->
<!--					<template #suffix>-->
<!--						<div class="flex flex-col items-center gap-2">-->
<!--							<NButton size="small" type="primary" @click="changeShowModal('modify', item)">-->
<!--								{{ t('common.edit') }}-->
<!--							</NButton>-->
<!--							<NButton tertiary size="small" type="error" @click="deletePromptTemplate(item)">-->
<!--								{{ t('common.delete') }}-->
<!--							</NButton>-->
<!--						</div>-->
<!--					</template>-->
<!--				</NListItem>-->
<!--			</NList>-->
<!--		</div>-->
<!--	</NModal>-->

<!--	<NModal v-model:show="showModal" style="width: 90%; max-width: 600px;" preset="card">-->
<!--		<NSpace v-if="modalMode === 'add' || modalMode === 'modify'" vertical>-->
<!--			提示词标题-->
<!--			<NInput v-model:value="tempPromptKey"  placeholder="请输入提示词标题，以便请输入快速查找"/>-->
<!--			提示词描述-->
<!--			<NInput v-model:value="tempPromptValue" type="textarea"  placeholder="根据你的需要，自定义提示词内容，参考公式“角色+问题+要求”"/>-->
<!--			<NButton-->
<!--				block-->
<!--				type="primary"-->
<!--				:disabled="inputStatus"-->
<!--				@click="addPromptTemplate()"-->
<!--			>-->
<!--				{{ t('common.confirm') }}-->
<!--			</NButton>-->
<!--		</NSpace>-->

<!--	</NModal>-->

<!--	<NModal v-model:show="showModal2" style="width: 100%; max-width: 900px;" preset="card">-->

<!--		<n-data-table-->
<!--			v-if="!isMobile"-->
<!--			:max-height="400"-->
<!--			:columns="columns2"-->
<!--			:data="data2"-->
<!--			:pagination="pagination"-->
<!--			:bordered="true"-->
<!--		/>-->

<!--		<NList v-if="isMobile" style="height:100%; overflow-y: auto;width:100%">-->
<!--			<NListItem v-for="(item, index) of data2" :key="index"  class="dei" style="width:100%" >-->
<!--				<template #suffix>-->
<!--					<div style="display: flex; justify-content: space-between;width:100%">-->
<!--						<div style="font-weight: 600;width:80%" >{{item.renderKey}}</div>-->
<!--						<div  class="">-->
<!--							<NButton  size="small"   type="primary" @click="play(item)">选用</NButton>-->
<!--						</div>-->
<!--					</div>-->
<!--					<div style="width:100%;margin-top:5px">{{item.renderValue}}</div>-->
<!--				</template>-->
<!--				&lt;!&ndash; <NThing :title="item.renderKey" :description="item.renderValue" />-->
<!--				 <template #suffix>-->
<!--					 <div class="flex flex-col items-center gap-2">-->
<!--						 <NButton tertiary size="small" type="info" @click="play(item)">选中</NButton>-->
<!--					 </div>-->
<!--				 </template>&ndash;&gt;-->
<!--			</NListItem>-->
<!--		</NList>-->

<!--	</NModal>-->

<!--</template>-->

<!--<style>-->

<!--.dei{-->
<!--	display: inline-block !important;-->

<!--}-->
<!--</style>-->
