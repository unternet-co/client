import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './command-bar';

const meta = {
  title: 'Components/CommandBar',
  tags: ['autodocs'],
  component: 'command-bar',
  render: () => html`<command-bar></command-bar>`,
} satisfies Meta<typeof HTMLElement>;

export default meta;
type Story = StoryObj<typeof HTMLElement>;

export const Default: Story = {};

