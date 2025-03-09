import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './applet-picker';
import type { Resource } from '@unternet/kernel';

interface AppletPickerProps {
  resources: Resource[];
}

const meta = {
  title: 'Components/AppletPicker',
  tags: ['autodocs'],
  component: 'applet-picker',
  render: (args: AppletPickerProps) => html`
    <applet-picker .resources=${args.resources}></applet-picker>
  `,
  argTypes: {
    resources: { control: 'object' }
  }
} satisfies Meta<AppletPickerProps>;

export default meta;
type Story = StoryObj<AppletPickerProps>;

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
    ]
  }
};

export const Empty: Story = {
  args: {
    resources: []
  }
};
