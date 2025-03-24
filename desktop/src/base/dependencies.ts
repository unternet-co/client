export class DependencyContainer {
  private singletons = new Map<string, any>();

  registerSingleton<T>(name: string, instance: T): void {
    const token = name;
    this.singletons.set(token, instance);
  }

  resolve<T>(token: string): T {
    const instance = this.singletons.get(token);
    if (!instance)
      throw new Error(`No singleton registered for token: ${String(token)}`);
    return instance;
  }
}

export const dependencies = new DependencyContainer();
