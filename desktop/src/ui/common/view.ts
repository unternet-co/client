import { Disposable } from '../../common/disposable';

export interface IView extends Disposable {
  elem: HTMLElement;
}

export class View extends Disposable implements IView {
  elem: HTMLElement;
}
