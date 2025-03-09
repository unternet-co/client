import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './top-bar';

const meta = {
  title: 'Components/TopBar',
  tags: ['autodocs'],
  component: 'top-bar',
  render: () => html`<top-bar></top-bar>`,
} satisfies Meta<typeof HTMLElement>;

export default meta;
type Story = StoryObj<typeof HTMLElement>;

export const Default: Story = {};
