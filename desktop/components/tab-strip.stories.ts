import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './tab-strip';
import type { Tab } from '../features/tabs';

interface TabStripProps {
  tabs: Tab[];
  selected: number;
}

const meta = {
  title: 'Components/TabStrip',
  tags: ['autodocs'],
  component: 'tab-strip',
  render: (args: TabStripProps) => html`
    <tab-strip
      .tabs=${args.tabs}
      .selected=${args.selected}
    ></tab-strip>
  `,
  argTypes: {
    tabs: { control: 'object' },
    selected: { control: 'number' }
  }
} satisfies Meta<TabStripProps>;

export default meta;
type Story = StoryObj<TabStripProps>;

export const Default: Story = {
  args: {
    tabs: [
      { id: 1, title: 'Tab 1', type: 'workspace', workspaceId: 1 },
      { id: 2, title: 'Tab 2', type: 'workspace', workspaceId: 2 },
      { id: 3, title: 'Tab 3', type: 'workspace', workspaceId: 3 }
    ],
    selected: 1
  }
};