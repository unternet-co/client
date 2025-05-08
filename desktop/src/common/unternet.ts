import Unternet from '@unternet/sdk';

export const unternet = new Unternet({
  apiKey: import.meta.env.APP_UNTERNET_API_KEY,
  isDev: import.meta.env.DEV,
});
