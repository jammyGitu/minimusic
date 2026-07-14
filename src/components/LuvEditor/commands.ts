// commands.ts - 编辑器命令系统

import { BaseRange, Editor, Transforms, Path, Location, Range, NodeEntry } from 'slate';
import { ReactEditor } from 'slate-react';
import { v4 as uuidv4 } from 'uuid';
import { CustomElement } from './types';

// 列表类型
const LIST_TYPES = ['numbered-list', 'bulleted-list'];

// 插入节点初始值配置
export const INSERT_NODE_INIT_VALUES: Record<string, Partial<CustomElement>> = {
  roll: {
    data: {
      timeLength: 16,
      currentTrack: 'piano',
      tracks: [
        {
          range: ['C4', 'C5'],
          instrument: 'piano',
          notes: [],
        },
        {
          instrument: 'drum',
          notes: [],
        },
      ],
    },
  },
  note: {
    noteStr: 'C4',
    editing: true,
  },
  img: {
    url: '',
  },
  bili: {
    url: '',
  },
};

export class Commands {
  editor: ReactEditor;

  constructor(editor: Editor) {
    this.editor = editor as ReactEditor;
  }

  // ==================== 工具方法 ====================

  /**
   * 检查块是否激活
   */
  isBlockActive = (format: string): boolean => {
    const { editor } = this;
    const [match] = Editor.nodes(editor, {
      match: (n) => !Editor.isEditor(n) && (n as CustomElement).type === format,
    });
    return !!match;
  };

  /**
   * 检查标记是否激活
   */
  isMarkActive = (format: string): boolean => {
    const { editor } = this;
    const marks = Editor.marks(editor);
    return marks ? (marks as Record<string, boolean>)[format] === true : false;
  };

  /**
   * 获取编辑器数据
   */
  getData = (): CustomElement[] => {
    return this.editor.children as CustomElement[];
  };

  /**
   * 查找节点
   */
  findNode = (id: string): [CustomElement, Path] | undefined => {
    const { editor } = this;
    const [node] = Editor.nodes(editor, {
      match: (n) => !Editor.isEditor(n) && (n as CustomElement).id === id,
    });
    return node as [CustomElement, Path] | undefined;
  };

  // ==================== 标记操作 ====================

  /**
   * 移除所有标记
   */
  removeAllMarks = (): void => {
    const { editor } = this;
    const marks = Editor.marks(editor);
    if (marks) {
      Object.keys(marks).forEach((format) => {
        Editor.removeMark(editor, format);
      });
    }
  };

  /**
   * 切换标记
   */
  toggleMark = (format: string): void => {
    const { editor, isMarkActive, removeAllMarks } = this;
    const isActive = isMarkActive(format);

    removeAllMarks();
    if (!isActive) {
      Editor.addMark(editor, format, true);
    }
  };

  // ==================== 块操作 ====================

  /**
   * 切换块类型
   */
  toggleBlock = (format: string): void => {
    const { editor, isBlockActive } = this;
    const isActive = isBlockActive(format);
    const isList = LIST_TYPES.includes(format);

    // 展开列表
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        LIST_TYPES.includes((n as CustomElement).type),
      split: true,
    });

    // 设置节点类型
    Transforms.setNodes(editor, {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    } as Partial<CustomElement>);

    // 如果是列表且未激活，包装节点
    if (!isActive && isList) {
      const block = { type: format, children: [] } as CustomElement;
      Transforms.wrapNodes(editor, block);
    }
  };

  /**
   * 插入行内元素
   */
  insertInline = (name: string, config: Record<string, any> = {}): string | undefined => {
    const { editor } = this;
    const id = uuidv4();

    const element: CustomElement = {
      type: name,
      [name]: true,
      id,
      ...config,
      children: [{ text: '' }],
    } as CustomElement;

    Transforms.insertNodes(editor, element);
    return id;
  };

  /**
   * 插入块级元素
   */
  insertBlock = (name: string, config: Record<string, any> = {}): string => {
    const { editor } = this;
    const blockId = uuidv4();

    const element: CustomElement = {
      type: name,
      id: blockId,
      ...config,
      children: [{ text: '' }],
    } as CustomElement;

    Transforms.insertNodes(editor, element);
    return blockId;
  };

  /**
   * 设置块数据
   */
  setBlockData = (id: string, data: Record<string, any>): void => {
    const { editor } = this;

    Transforms.setNodes(
      editor,
      data as Partial<CustomElement>,
      {
        match: (node) =>
          !Editor.isEditor(node) && (node as CustomElement).id === id,
      }
    );
  };

  /**
   * 获取当前选中的块元素
   */
  getCurrentBlock = (): CustomElement | null => {
    const { editor } = this;
    const { selection } = editor;

    if (!selection) return null;

    const [node] = Editor.node(editor, selection);
    if (!node) return null;

    // 如果是文本节点，向前查找祖先块
    if (Editor.isEditor(node)) {
      return null;
    }

    const element = node as CustomElement;
    if ('text' in element) {
      // 这是文本节点，获取父节点
      const [parent] = Editor.nodes(editor, {
        at: selection,
        match: (n) => !Editor.isEditor(n) && !('text' in n),
      });
      return parent ? (parent[0] as CustomElement) : null;
    }

    return element;
  };

  /**
   * 聚焦到下一个块
   */
  focusNextBlock = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const { editor } = this;
    const { selection } = editor;

    event.preventDefault();

    if (!selection) return;

    const nextIndex = selection.anchor.path[0] + 1;
    const next = editor.children[nextIndex] as CustomElement | undefined;

    if (next) {
      this.refocus(editor, [nextIndex]);
      return;
    }

    // 如果没有下一个节点，插入新段落
    const emptyElement: CustomElement = {
      type: 'paragraph',
      children: [{ text: '' }],
    };
    Transforms.insertNodes(editor, emptyElement, {
      at: [editor.children.length],
    });

    const last = Editor.last(editor, []);
    this.refocus(editor, last ? last[1] : [editor.children.length - 1]);
  };

  /**
   * 聚焦到下一个行内元素
   */
  focusNextInline = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const { editor } = this;
    const { selection } = editor;

    event.preventDefault();

    if (!selection) return;

    const nextIndex = selection.anchor.path[1] + 1;
    this.refocus(editor, {
      path: [selection.anchor.path[0], nextIndex],
      offset: 0,
    });
  };

  /**
   * 重新聚焦编辑器
   */
  refocus = (editor: Editor, path?: Location): void => {
    const { selection } = editor;

    // 使用 any 类型转换避免类型问题
    (ReactEditor as any).focus(editor);

    if (path) {
      Transforms.select(editor, path);
      return;
    }

    if (!selection || !selection.anchor || !selection.focus) {
      return;
    }

    // 延迟选择确保焦点
    setTimeout(() => {
      Transforms.select(editor, selection.focus);
    }, 20);
  };

  /**
   * 聚焦到指定节点
   */
  focusNode = (id: string): void => {
    const { editor } = this;
    const nodeEntry = this.findNode(id);

    if (nodeEntry) {
      const [, path] = nodeEntry;
      ReactEditor.focus(editor as ReactEditor);
      Transforms.select(editor, path);
    }
  };

  /**
   * 删除指定块
   */
  deleteBlock = (id: string): void => {
    const { editor } = this;
    const nodeEntry = this.findNode(id);

    if (nodeEntry) {
      const [, path] = nodeEntry;
      Transforms.removeNodes(editor, { at: path });
    }
  };

  /**
   * 在指定位置后插入块
   */
  insertBlockAfter = (afterId: string, name: string, config: Record<string, any> = {}): string => {
    const { editor } = this;
    const nodeEntry = this.findNode(afterId);

    if (!nodeEntry) {
      return this.insertBlock(name, config);
    }

    const [, path] = nodeEntry;
    const blockId = uuidv4();

    const element: CustomElement = {
      type: name,
      id: blockId,
      ...config,
      children: [{ text: '' }],
    } as CustomElement;

    Transforms.insertNodes(editor, element, {
      at: [path[0] + 1],
    });

    return blockId;
  };
}
