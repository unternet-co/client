import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './applet-view';

interface AppletViewProps {
  processId: number;
  src: string;
  data: any;
}

const meta = {
  title: 'Components/AppletView',
  tags: ['autodocs'],
  component: 'applet-view',
  render: (args: AppletViewProps) => html`
    <applet-view
      .processId=${args.processId}
      .src=${args.src}
      .data=${args.data}
    ></applet-view>
  `,
  argTypes: {
    processId: { control: 'number' },
    src: { control: 'text' },
    data: { control: 'object' }
  }
} satisfies Meta<AppletViewProps>;

export default meta;
type Story = StoryObj<AppletViewProps>;

export const Default: Story = {
  args: {
    processId: 1,
    src: 'https://example.com/applet',
    data: {
      query: 'example query',
      options: {
        limit: 10,
        offset: 0
      }
    }
  }
};

export const NoData: Story = {
  args: {
    processId: 2,
    src: 'https://example.com/applet',
    data: null
  }
};
