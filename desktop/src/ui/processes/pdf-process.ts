import { Process } from '@unternet/kernel';
import { PDFViewer } from '../components/pdf-viewer';

export class PDFProcess extends Process {
  private viewer: PDFViewer;

  constructor(data: string) {
    super();
    this.viewer = new PDFViewer();
    this.viewer.src = data;
  }

  mount(host: HTMLElement): void {
    host.appendChild(this.viewer);
  }

  unmount(): void {
    this.viewer.remove();
  }

  describe(): string {
    return 'PDF Viewer';
  }

  get snapshot(): any {
    return {
      type: 'pdf',
      src: this.viewer.src,
    };
  }
}
