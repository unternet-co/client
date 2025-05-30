import { Disposable } from '../../common/disposable';

export interface IView extends Disposable {
  element: HTMLElement;
}

export class View extends Disposable implements IView {
  element: HTMLElement;
}
