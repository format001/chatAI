<script setup lang='ts'>
import { computed ,ref} from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import defaultAvatar from '@/assets/avatar.jpg'
import { isString } from '@/utils/is'

import Setting from '@/components/common/Setting/index.vue';
interface Props {
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: '',
})
let styleType = ref(props.type||null)//computed(() => String(props.type))
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const show = ref(false)

function checkLogin(){
  if(!localStorage.getItem('user_token')){
    localStorage.clear()
  location.reload()
  }else{
    show.value = true
  }
}

</script>

<template>
  <div class="flex items-center overflow-hidden" :class="styleType=='start'?'column_start':''"  v-if="userInfo.nickname">
    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0" :class="styleType=='start'?'column_start':''">
      <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
        <NAvatar
          size="large"
          :src="userInfo.avatar"
          :fallback-src="defaultAvatar"
        />
      </template>
      <template v-else>
        <NAvatar size="large" round :src="defaultAvatar" />
      </template>
    </div>
    <div class="flex-1 min-w-0 ml-2" :class="styleType=='start'?'column_start':''">
      <h2 class="overflow-hidden text-md text-ellipsis whitespace-nowrap">
				会员：{{userInfo.phone}}
      </h2>
      <p class="overflow-hidden text-xs text-gray-500 text-ellipsis whitespace-nowrap">
         有效期：{{userInfo.terminate_time}}
      </p>
    </div>
  </div>
  
  
  <Setting v-if="show" v-model:visible="show" />
</template>

<style >
.column_start{
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  justify-content:  flex-start;
  margin-top: 10px;
  margin-left: unset !important;
}
</style>
