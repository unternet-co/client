import { USER_DATA_FOLDER } from '../constants';

export interface JsonStoreServiceOptions {
  folder?: string;
  autoSave?: boolean;
}

export class JsonStoreService<T> {
  private filePath: string;
  private value: T;
  private watchers: ((value: T) => void)[] = [];
  private isWatching = false;
  private autoSave: boolean;

  constructor(
    private name: string,
    private defaultValue: T,
    options: JsonStoreServiceOptions = {}
  ) {
    const { folder = USER_DATA_FOLDER, autoSave = true } = options;
    this.filePath = `${folder}/${name}.json`;
    this.value = defaultValue;
    this.autoSave = autoSave;
  }

  async load(): Promise<T> {
    console.log(window.fileService);
    const existsResult = await window.fileService.exists(this.filePath);

    if (existsResult.success && existsResult.data) {
      const readResult = await window.fileService.read(this.filePath);
      if (readResult.success && readResult.data) {
        try {
          this.value = JSON.parse(readResult.data);
        } catch (error) {
          console.error(`Failed to parse ${this.name}.json:`, error);
          this.value = this.defaultValue;
          if (this.autoSave) await this.save();
        }
      }
    } else {
      this.value = this.defaultValue;
      if (this.autoSave) await this.save();
    }

    this.setupFileWatching();
    return this.value;
  }

  get(): T {
    return this.value;
  }

  async set(value: T): Promise<void> {
    this.value = value;
    if (this.autoSave) await this.save();
    this.notifyWatchers(value);
  }

  async save(): Promise<void> {
    const result = await window.fileService.write(
      this.filePath,
      JSON.stringify(this.value, null, 2)
    );
    if (!result.success) {
      console.error(`Failed to save ${this.name}.json:`, result.error);
    }
  }

  watch(callback: (value: T) => void): void {
    this.watchers.push(callback);
  }

  cleanup(): void {
    if (this.isWatching) {
      window.fileService.unwatch(this.filePath);
      window.fileService.removeFileChangeListeners();
      this.isWatching = false;
    }
    this.watchers = [];
  }

  private async setupFileWatching(): Promise<void> {
    if (this.isWatching) return;

    this.isWatching = true;
    await window.fileService.watch(this.filePath);
    window.fileService.onFileChanged((event) => {
      if (event.filePath === this.filePath) {
        this.reloadFromFile();
      }
    });
  }

  private async reloadFromFile(): Promise<void> {
    const readResult = await window.fileService.read(this.filePath);
    if (readResult.success && readResult.data) {
      try {
        const newValue = JSON.parse(readResult.data);
        this.value = newValue;
        this.notifyWatchers(newValue);
      } catch (error) {
        console.error(
          `Failed to parse ${this.name}.json after external change:`,
          error
        );
      }
    }
  }

  private notifyWatchers(value: T): void {
    this.watchers.forEach((callback) => callback(value));
  }
}
