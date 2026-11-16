import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import ui from '@nuxt/ui/vue-plugin';

import App from './App.vue';
import { i18nPlugin } from './plugins/i18n';
import { VueDraggableGrid } from './plugins/vue-grid-layout';
import router from './router';
import './styles/tailwind.css';

const myApp = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
myApp.use(pinia);

myApp.use(ui);

myApp.use(router);
myApp.use(VueDraggableGrid);
myApp.use(i18nPlugin);

// Vue.config.productionTip = false;
myApp.mount('#app');
