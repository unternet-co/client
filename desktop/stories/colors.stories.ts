import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './colors.css';

const meta = {
  title: 'Colors',
  tags: ['autodocs'],
  render: () => html`
    <div style="padding: 2rem">
      <div class="swatch" style="background-color: var(--color-neutral-0); color: var(--color-text);">Neutral 0</div>
      <div class="swatch" style="background-color: var(--color-neutral-5); color: var(--color-text);">Neutral 5</div>
      <div class="swatch" style="background-color: var(--color-neutral-10); color: var(--color-text);">Neutral 10</div>
      <div class="swatch" style="background-color: var(--color-neutral-15); color: var(--color-text);">Neutral 15</div>
      <div class="swatch" style="background-color: var(--color-neutral-20); color: var(--color-text);">Neutral 20</div>
      <div class="swatch" style="background-color: var(--color-neutral-30); color: var(--color-text);">Neutral 30</div>
      <div class="swatch" style="background-color: var(--color-neutral-40); color: var(--color-text);">Neutral 40</div>
      <div class="swatch" style="background-color: var(--color-neutral-50); color: var(--color-page);">Neutral 50</div>
      <div class="swatch" style="background-color: var(--color-neutral-60); color: var(--color-page);">Neutral 60</div>
      <div class="swatch" style="background-color: var(--color-neutral-70); color: var(--color-page);">Neutral 70</div>
      <div class="swatch" style="background-color: var(--color-neutral-80); color: var(--color-page);">Neutral 80</div>
      <div class="swatch" style="background-color: var(--color-neutral-90); color: var(--color-page);">Neutral 90</div>
      <div class="swatch" style="background-color: var(--color-neutral-100); color: var(--color-page);">Neutral 100</div>
      <br/>
      <div class="swatch" style="background-color: var(--color-action); color: var(--color-page);">Action</div>
      <div class="swatch" style="background-color: var(--color-success); color: var(--color-page);">Success</div>
      <div class="swatch" style="background-color: var(--color-warning); color: var(--color-text);">Warning</div>
      <div class="swatch" style="background-color: var(--color-error); color: var(--color-page);">Error</div>
    </div>
  `,
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {};
