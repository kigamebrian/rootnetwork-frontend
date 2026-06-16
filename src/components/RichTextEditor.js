// frontend/src/components/RichTextEditor.js
import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import './RichTextEditor.css';

// DEFINE EXTENSIONS ONCE - OUTSIDE COMPONENT, NEVER RECREATED
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  Placeholder.configure({
    placeholder: 'Write your post content here...',
    emptyEditorClass: 'is-editor-empty',
  }),
  Image.configure({ inline: true, allowBase64: true }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Highlight,
  TextStyle,
  Color,
];

const Toolbar = React.memo(({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough">
          <s>S</s>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''} title="Highlight">
          <mark>H</mark>
        </button>
      </div>

      <div className="toolbar-group">
        <select onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level) editor.chain().focus().toggleHeading({ level }).run();
          else editor.chain().focus().setParagraph().run();
        }}>
          <option value="">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Align Left">
          ⬅️
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Align Center">
          ⬌
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Align Right">
          ➡️
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} title="Justify">
          ☰
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List">
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Numbered List">
          1. List
        </button>
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={addImage} title="Insert Image">
          🖼️ Image
        </button>
        <button type="button" onClick={addLink} title="Insert Link">
          🔗 Link
        </button>
        <button type="button" onClick={addTable} title="Insert Table">
          📊 Table
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Quote">
          " Quote
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line">
          —
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Code Block">
          {'</>'}
        </button>
      </div>

      <div className="toolbar-group">
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="Text Color"
          style={{ width: '30px', height: '30px', cursor: 'pointer' }}
        />
      </div>

      <div className="toolbar-group">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Undo">
          ↺
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Redo">
          ↻
        </button>
      </div>
    </div>
  );
});

// Main RichTextEditor component
function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    immediatelyRender: false,
  });

  // Update content when value changes from outside
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="rich-text-editor-loading">Loading editor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

export default React.memo(RichTextEditor);