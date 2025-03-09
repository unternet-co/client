import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './typography.css';

const meta = {
  title: 'Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Scale: Story = {
  render: () => html`
    <div class="type-scale">
      <div class="text-3xl">3xl - The quick brown fox jumps over the lazy dog</div>
      <div class="text-2xl">2xl - The quick brown fox jumps over the lazy dog</div>
      <div class="text-xl">xl - The quick brown fox jumps over the lazy dog</div>
      <div class="text-lg">lg - The quick brown fox jumps over the lazy dog</div>
      <div class="text-base">base - The quick brown fox jumps over the lazy dog</div>
      <div class="text-sm">sm - The quick brown fox jumps over the lazy dog</div>
      <div class="text-xs">xs - The quick brown fox jumps over the lazy dog</div>
    </div>
  `
};

export const Faces: Story = {
  render: () => html`
    <div class="type-faces">
      <div class="font-group font-sans">
        <h3>Sans Serif (--font-sans)</h3>
        <p>Regular - The quick brown fox jumps over the lazy dog</p>
        <p><strong>Bold - The quick brown fox jumps over the lazy dog</strong></p>
        <p><em>Italic - The quick brown fox jumps over the lazy dog</em></p>
      </div>

      <div class="font-group font-mono">
        <h3>Monospace (--font-mono)</h3>
        <p>Regular - The quick brown fox jumps over the lazy dog</p>
        <p><strong>Bold - The quick brown fox jumps over the lazy dog</strong></p>
        <p><em>Italic - The quick brown fox jumps over the lazy dog</em></p>
      </div>
    </div>
  `
};

export const Prose: Story = {
  render: () => html`
    <div class="type-prose">
      <div class="prose">
        <h1>Main Heading</h1>
        <p>This is a lead paragraph that introduces the content. It should be engaging and set the context for what follows.</p>
        
        <h2>Secondary Heading</h2>
        <p>Regular paragraph with <em>emphasized</em> and <strong>bold</strong> text. Also includes <a href="#">links</a> and <code>inline code</code>.</p>
        
        <h3>Tertiary Heading</h3>
        <ul>
          <li>Unordered list item one</li>
          <li>List item with <a href="#">a link</a></li>
          <li>A longer list item that wraps to multiple lines to demonstrate line height and spacing</li>
        </ul>
        
        <h4>Fourth Level Heading</h4>
        <ol>
          <li>Ordered list item one</li>
          <li>Second ordered list item</li>
          <li>Third ordered list item</li>
        </ol>
        
        <blockquote>
          <p>This is a blockquote. It might contain a notable quote or callout text that deserves special styling.</p>
        </blockquote>
        
        <pre><code>// This is a code block
function example() {
  return 'Hello, World!';
}</code></pre>
      </div>
    </div>
  `
};
