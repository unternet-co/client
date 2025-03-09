import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './app-root';

interface AppRootProps {
  showResourcePicker: boolean;
}

const meta = {
  title: 'Components/AppRoot',
  tags: ['autodocs'],
  component: 'app-root',
  render: (args: AppRootProps) => html`
    <app-root showResourcePicker=${args.showResourcePicker}></app-root>
  `,
  argTypes: {
    showResourcePicker: { control: 'boolean' }
  }
} satisfies Meta<AppRootProps>;

export default meta;
type Story = StoryObj<AppRootProps>;

export const Default: Story = {
  args: {
    showResourcePicker: false
  }
};
