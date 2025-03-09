import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';


const meta = {
  title: 'Magic Cursor',
  tags: ['autodocs'],
  render: () => html`
    <div style="padding: 2rem; min-height: 30vh">
        <script src="./lib/unicornStudio.umd.js"></script>
         <div
            style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; mix-blend-mode: darken; opacity: 0.5;"
            data-us-project-src="unicorn-scenes/mouse.json"
            data-us-disablemobile="true"
            data-us-scale="1"
            data-us-dpi="1"
        ></div>
        <script>
            UnicornStudio.init()
            .then((scenes) => {
            // Scenes are ready
            })
            .catch((err) => {
            console.error(err);
            });
        </script>
    </div>
  `,
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
