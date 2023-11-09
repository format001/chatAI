<script setup lang='ts'>
import {defineAsyncComponent, computed, ref, toRefs, reactive} from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import {useUserStore} from "@/store";

    const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'));

    let show = ref(false);

    const userStore = useUserStore(),
        windowOpenState = reactive(['我的助教', 'MJ绘画', '管理后台']);

    function onWindowOpen(payload) {
			let url;
			switch (payload) {
				case '我的助教':
					url = userStore.getUserInfo.cus_url;
					break;
				case 'MJ绘画':
					url = "http://www.mj.114ms.com/mobile/pages/drawing/drawing?token=" + localStorage.getItem('user_token');
					break;
				case '管理后台':
					url = 'http://ai.yunfensi.com/#/login';
					break;
				default:
					break;
			}
			url && window.open(url)
    }

    function onCheckLogin() {
        if(!localStorage.getItem('user_token')){
            localStorage.clear()
            location.reload()
        }else{
            show.value = true
        }
    }

</script>

<template>
    <template v-for="(item, index) in windowOpenState"  :key="index">
        <div
            class="border foot-btn"
            @click="onWindowOpen(item)"
        >
            {{ item }}
        </div>
    </template>

    <footer  v-if="userStore.getUserInfo.nickname"
             @click="onCheckLogin()">
        <div  class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
            <div class="flex-1 flex-shrink-0 overflow-hidden;" style="text-align: center">
            <span >
                <UserAvatar/>
            </span>
        </div>

        <HoverButton>
            <span class="text-xl text-[#4f555e] dark:text-white">
                <SvgIcon icon="ri:settings-4-line" />
            </span>
        </HoverButton>

        <Setting v-if="show" v-model:visible="show" />
        </div>
    </footer>

</template>

<style scoped>
.foot-btn {
    cursor: pointer;
    height:50px;
    line-height:50px;
    font-size: 14px;
    font-weight:bold;
    text-align:center
}

.quit-btn {
  display:flex;
  flex-direction:row;
  items-align:center;
  justify-content:center;
  padding: 12px;
  background-color: #FF5D5D;
  border-radius: 5px;
  text-align:center;

}
.quit-btn>text {
  color: #fff;
  font-size: 14px;
}

</style>










<!--<script setup lang='ts'>-->
<!--import {defineAsyncComponent, computed, ref, toRefs, reactive} from 'vue'-->
<!--import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'-->
<!--import {useUserStore} from "@/store";-->

<!--const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))-->
<!--const Setting2 = defineAsyncComponent(() => import('@/components/common/Setting/index2.vue'))-->

<!--    const userStore = useUserStore()-->
<!--    let state = reactive({-->
<!--        show: false,-->
<!--        showModal: false,-->
<!--        checkMJUrl: "http://www.mj.114ms.com/mobile/pages/drawing/drawing?token=" + localStorage.getItem('user_token'),-->
<!--        adminUrl: 'http://ai.yunfensi.com/#/login'-->
<!--    })-->
<!--    const show = ref(false)-->
<!--    const showModal= ref(false)-->
<!--    const constantType = {-->
<!--        windowOpen: 'windowOpen',-->
<!--        checkLogin: checkLogin-->
<!--    }-->

<!--// const userInfo = computed(() => userStore.userInfo)-->

<!--    function onAction(type, payload) {-->
<!--        switch (type) {-->
<!--            case constantType.windowOpen:-->
<!--                    window.open(payload.url)-->
<!--                break-->
<!--        }-->
<!--    }-->


<!--function quitEvent() {-->
<!--  localStorage.clear()-->
<!--  location.reload()-->
<!--}-->
<!--function checkLogin(){-->

<!--  if(!localStorage.getItem('user_token')){-->
<!--    localStorage.clear()-->
<!--  location.reload()-->
<!--  }else{-->
<!--    show.value = true-->
<!--  }-->
<!--}-->


<!--function tg(){-->
<!--  if(!localStorage.getItem('user_token')){-->
<!--    localStorage.clear()-->
<!--    location.reload()-->
<!--  }else{-->
<!--    showModal.value = true-->
<!--  }-->
<!--}-->
<!--// 管理后台-->
<!--//     function admin(){-->
<!--//        window.open("http://ai.yunfensi.com/#/login");-->
<!--//     }-->
<!--// MJ绘画-->
<!--    // function checkMJ(){-->
<!--    //    const token= localStorage.getItem('user_token');-->
<!--    //  //  window.open("http://www.mj.114ms.com/#/pages/drawing/drawing?token="+token);-->
<!--    //   window.open("http://www.mj.114ms.com/mobile/pages/drawing/drawing?token="+token);-->
<!--    // }-->
<!--</script>-->

<!--<template>-->
<!--&lt;!&ndash;    	<div  @click="tg()" class="border-t"  style=" cursor: pointer;height:50px;line-height:50px;font-size: 14px;font-weight:bold;text-align:center">推广海报</div>-->
<!--    	&ndash;&gt;-->

<!--    <div-->
<!--        @click="onAction(-->
<!--            constantType.windowOpen,{-->
<!--                url: userStore.getUserInfo.cus_url-->
<!--            })"-->
<!--            class="border-t"  style=" cursor: pointer;height:50px;line-height:50px;font-size: 14px;font-weight:bold;text-align:center">我的助教</div>-->
<!--    <div-->
<!--        @click="onAction(constantType.windowOpen, {-->
<!--                url: state.checkMJUrl-->
<!--            })"-->
<!--          class="border-t"  style=" cursor: pointer;height:50px;line-height:50px;font-size: 14px;font-weight:bold;text-align:center">MJ绘画</div>-->
<!--    <div  @click="onAction(constantType.windowOpen, {-->
<!--                url: state.adminUrl-->
<!--            })"-->
<!--          class="border-t"  style=" cursor: pointer;height:50px;line-height:50px;font-size: 14px;font-weight:bold;text-align:center">管理后台</div>-->

<!--&lt;!&ndash;	<div  @click="checkLogin()" class="border-t"  style=" cursor: pointer;height:50px;line-height:50px;font-size: 14px;font-weight:bold;text-align:center">会员续费</div>&ndash;&gt;-->
<!--    <footer  v-if="userStore.getUserInfo.nickname">-->
<!--        <div  class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">-->

<!--        <div class="flex-1 flex-shrink-0 overflow-hidden;" style="text-align: center">-->
<!--        <span @click="checkLogin()">1-->
<!--        <UserAvatar   />-->
<!--        </span>-->
<!--        </div>-->

<!--        <HoverButton @click="checkLogin()">-->
<!--        <span class="text-xl text-[#4f555e] dark:text-white">-->
<!--        <SvgIcon icon="ri:settings-4-line" />-->
<!--        </span>-->
<!--        </HoverButton>-->

<!--        <Setting v-if="show" v-model:visible="show" />-->
<!--        <Setting2 v-if="showModal" v-model:visible="showModal" />-->
<!--        </div>-->
<!--        &lt;!&ndash; <div class="quit-btn" @click="quitEvent()">-->
<!--            <text>退出登录</text>-->
<!--        </div> &ndash;&gt;-->
<!--    </footer>-->

<!--</template>-->

<!--<style>-->
<!--.quit-btn {-->
<!--  display:flex;-->
<!--  flex-direction:row;-->
<!--  items-align:center;-->
<!--  justify-content:center;-->
<!--  padding: 12px;-->
<!--  background-color: #FF5D5D;-->
<!--  border-radius: 5px;-->
<!--  text-align:center;-->

<!--}-->
<!--.quit-btn>text {-->
<!--  color: #fff;-->
<!--  font-size: 14px;-->
<!--}-->

<!--</style>-->
