import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './thread-view';
import type { Interaction } from '@unternet/kernel';

interface ThreadViewProps {
  interactions: Interaction[];
  resources: any[];
  tab: Interaction[];
}

const meta = {
  title: 'Components/ThreadView',
  tags: ['autodocs'],
  component: 'thread-view',
  render: (args: ThreadViewProps) => html`
    <thread-view
      .interactions=${args.interactions}
      .resources=${args.resources}
      .tab=${args.tab}
    ></thread-view>
  `,
  argTypes: {
    interactions: { control: 'object' },
    resources: { control: 'object' },
    tab: { control: 'object' }
  }
} satisfies Meta<ThreadViewProps>;

export default meta;
type Story = StoryObj<ThreadViewProps>;

export const Default: Story = {
  args: {
    interactions: [
      {
        id: 1,
        input: {
          type: 'command',
          text: 'Can you help me with my code?'
        },
        outputs: [
          {
            type: 'text',
            content: 'Of course! What would you like help with?'
          }
        ]
      },
      {
        id: 2,
        input: {
          type: 'command',
          text: 'How do I create a new component?'
        },
        outputs: [
          {
            type: 'text',
            content: 'I can help you create a new web component using Lit. Would you like to see an example?'
          }
        ]
      }
    ],
    resources: [],
    tab: []
  }
};
