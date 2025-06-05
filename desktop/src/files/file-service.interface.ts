// Shared interface for type-safe IPC communication
export interface IFileService {
  read(filePath: string): Promise<FileResult<string>>;
  write(filePath: string, content: string): Promise<FileResult<void>>;
  exists(filePath: string): Promise<FileResult<boolean>>;
  watch(filePath: string): Promise<FileResult<void>>;
  unwatch(filePath: string): Promise<FileResult<void>>;
  getAppDataPath(): Promise<FileResult<string>>;
}

export interface FileResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileChangeEvent {
  filePath: string;
}
