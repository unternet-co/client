import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './context-bar';
import type { Resource } from '@unternet/kernel';

interface ContextBarProps {
  resources: Resource[];
  isAppletPickerOpen: boolean;
}

const meta = {
  title: 'Components/ContextBar',
  tags: ['autodocs'],
  component: 'context-bar',
  render: (args: ContextBarProps) => html`
    <context-bar
      .resources=${args.resources}
      .isAppletPickerOpen=${args.isAppletPickerOpen}
    ></context-bar>
  `,
  argTypes: {
    resources: { control: 'object' },
    isAppletPickerOpen: { control: 'boolean' }
  }
} satisfies Meta<ContextBarProps>;

export default meta;
type Story = StoryObj<ContextBarProps>;

export const Default: Story = {
  args: {
    resources: [
      {
        type: 'web',
        name: 'Search Engine',
        short_name: 'Search',
        url: 'https://search.example.com',
        icons: [
          {
            src: 'https://via.placeholder.com/32',
            sizes: '32x32',
            type: 'image/png'
          }
        ]
      },
      {
        type: 'web',
        name: 'Code Assistant',
        short_name: 'Code',
        url: 'https://code.example.com',
        icons: [
          {
            src: 'https://via.placeholder.com/32',
            sizes: '32x32',
            type: 'image/png'
          }
        ]
      }
    ],
    isAppletPickerOpen: false
  }
};

export const WithAppletPicker: Story = {
  args: {
    resources: [
      {
        type: 'web',
        name: 'Search Engine',
        short_name: 'Search',
        url: 'https://search.example.com',
        icons: [
          {
            src: 'https://via.placeholder.com/32',
            sizes: '32x32',
            type: 'image/png'
          }
        ]
      }
    ],
    isAppletPickerOpen: true
  }
};

export const Empty: Story = {
  args: {
    resources: [],
    isAppletPickerOpen: false
  }
};
