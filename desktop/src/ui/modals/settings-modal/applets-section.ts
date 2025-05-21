import { html, render } from 'lit';

export const appletsSectionDef = {
  key: 'applets',
  label: 'Applets',
  render: () => html`<applets-section></applets-section>`,
};

export class AppletsSection extends HTMLElement {
  #appletsDir: undefined | string;

  connectedCallback() {
    this.render();
    system.localAppletsDirectory().then((dir) => {
      this.#appletsDir = dir;
      this.render();
    });
  }

  render() {
    if (!this.#appletsDir) {
      return render(html``, this);
    }

    render(
      html`
        <form>
          <h3>Applets</h3>
          <fieldset>
            <legend style="margin-bottom: var(--space-4);">
              Local applets
            </legend>
            <p>
              You can add web applets directly from your device to your
              workspace. To add a web applet, you put your project in the folder
              shown below. It'll look for directories with both an index.html
              and manifest.json file.
            </p>
          </fieldset>
          <p>
            <span style="display: block; margin-bottom: var(--space-2);"
              >Your local applets are located at:</span
            >
            <un-input disabled value="${this.#appletsDir}" />
          </p>
          <p>
            <un-button
              @click=${async () => {
                system.openLocalAppletsDirectory();
              }}
              >Open directory</un-button
            >
          </p>
        </form>
      `,
      this
    );
  }
}

customElements.define('applets-section', AppletsSection);
