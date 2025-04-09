import { produce } from 'immer';

export class KeyStoreService<ValueType> {
  private _name: string;
  private _value: ValueType;

  get value() {
    return this._value;
  }

  constructor(name: string, initValue: any) {
    this._name = name;

    const currentValue = localStorage.getItem(name);
    if (currentValue) {
      this._value = JSON.parse(currentValue) as ValueType;
    } else {
      this._value = initValue;
      localStorage.setItem(name, JSON.stringify(initValue));
    }
  }

  get() {
    const value = localStorage.getItem(this._name)!;
    return JSON.parse(value) as ValueType;
  }

  update(updater: Partial<ValueType> | ((value: ValueType) => void)) {
    const currentValue = this.get();
    if (typeof updater === 'function') {
      this.set(produce(currentValue, updater));
    } else {
      this.set({ ...currentValue, ...updater });
    }
  }

  set(value: ValueType) {
    localStorage.setItem(this._name, JSON.stringify(value));
  }
}
