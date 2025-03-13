import { liveQuery } from 'dexie';
import db from './db';

export interface Config {
  activeTab: number;
  isResourcePickerOpen: boolean;
}

const initConfig = {
  activeTab: 0,
  isResourcePickerOpen: false,
};

async function toggleResourcePicker() {
  const value = await config.get('isResourcePickerOpen');
  return config.set('isResourcePickerOpen', !value);
}

async function set<K extends keyof Config>(key: K, value: Config[K]) {
  try {
    await db.config.put({ key, value: JSON.stringify(value) });
    console.log(`[Config] Set`, { [key]: value });
  } catch (error) {
    console.error(`[Config] Error saving ${key}:`, error);
  }
}

async function all() {
  const items = await db.config.toArray();
  const fullConfig = {};
  for (const item of items) {
    fullConfig[item.key] = JSON.parse(item.value);
  }
  return fullConfig as Config;
}

async function get<K extends keyof Config>(key?: K): Promise<Config[K] | null> {
  try {
    const item = await db.config.get(key);
    return item ? JSON.parse(item.value) : null;
  } catch (error) {
    console.error(`[Config] Error getting ${key}:`, error);
    return null;
  }
}

async function write(newConfig: Config) {
  const writePromises = Object.keys(newConfig).map((key) => {
    const typedKey = key as keyof Config;
    return db.config.put({
      key: typedKey,
      value: JSON.stringify(newConfig[typedKey]),
    });
  });

  try {
    await Promise.all(writePromises);
  } catch (error) {
    console.error('[Config] Error saving config items:', error);
  }
}

function subscribeToKey<K extends keyof Config>(
  key: K,
  callback: (value: Config[K]) => void
) {
  return liveQuery(() => config.get(key)).subscribe(callback);
}

export const config = {
  toggleResourcePicker,
  all,
  get,
  set,
  write,
  subscribeToKey,
};

db.on('ready', async () => {
  let currentConfig = (await config.all()) || {};
  console.log(currentConfig);
  config.write({ ...initConfig, ...currentConfig });
});
