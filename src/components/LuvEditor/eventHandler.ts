// eventHandler.ts - 事件处理系统

import { Editor, Range, Transforms, Element } from 'slate';
import { Commands } from './commands';
import { CustomElement, MODE, BLOCK_TYPES } from './types';
import { isFunction } from 'lodash';
import React from 'react';

export interface ToolbarRefType {
  update: () => void;
}

export interface EventHandlerExtra {
  mode: MODE;
  toolbarRef: React.RefObject<ToolbarRefType>;
  onChange?: (data: CustomElement[]) => void;
}

export interface EventHandler {
  onChange: (data: CustomElement[]) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
}

export class EventHandler {
  commands: Commands;
  extra: EventHandlerExtra;

  keyStack: string[] = [];

  constructor(commands: Commands, extra: EventHandlerExtra) {
    this.commands = commands;
    this.extra = extra;
  }

  /**
   * 内容变化处理
   */
  onChange = (newData: CustomElement[]): void => {
    const { mode, toolbarRef, onChange } = this.extra;

    // 更新工具栏状态
    if (mode === MODE.EDIT && toolbarRef.current) {
      toolbarRef.current.update();
    }

    // 触发外部 onChange 回调
    isFunction(onChange) && onChange(newData);
  };

  /**
   * 键盘按下处理
   */
  onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    // 检查系统快捷键
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      this.keyStack = [];
      return; // 让系统处理撤销操作
    }

    // 阻止重复按键
    if (this.keyStack.includes(e.key)) return;

    this.keyStack.push(e.key);
    const keysStr = this.keyStack.join('-');

    // 查找匹配的快捷键
    const handler = this.handlers[keysStr];
    if (handler) {
      this.keyStack = [];
      handler(e);
    }
  };

  /**
   * 键盘释放处理
   */
  onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const matchKeyIndex = this.keyStack.indexOf(e.key);
    if (matchKeyIndex > -1) {
      this.keyStack.splice(matchKeyIndex, 1);
    }
  };

  /**
   * 粘贴处理
   */
  onPaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    // 基础实现：允许默认粘贴行为
    // 可以扩展支持图片粘贴等
  };

  /**
   * 快捷键处理器映射
   */
  handlers: Record<string, (event: React.KeyboardEvent<HTMLDivElement>) => void> = {
    /**
     * 回车键处理
     */
    Enter: (event) => {
      const { editor } = this.commands;
      const { selection } = editor;

      if (selection && Range.isCollapsed(selection)) {
        const [node] = Editor.node(editor, selection);
        
        // 如果在块级元素中，回车后移动到下一个块
        if (node && !Editor.isEditor(node)) {
          const element = node as CustomElement;
          if (BLOCK_TYPES.includes(element.type as any)) {
            this.commands.focusNextBlock(event);
          }
        }
      }

      // 延迟重置格式和段落
      setTimeout(() => {
        this.commands.removeAllMarks();
        this.commands.toggleBlock('paragraph');
      });
    },

    /**
     * Tab 键 - 插入空格
     */
    Tab: (e) => {
      e.preventDefault();
      Editor.insertNode(this.commands.editor, {
        text: '    ', // 4个空格
      });
    },

    /**
     * Ctrl/Cmd + B - 加粗
     */
    'Control-b': (e) => {
      e.preventDefault();
      this.commands.toggleMark('bold');
    },
    'meta-b': (e) => {
      e.preventDefault();
      this.commands.toggleMark('bold');
    },

    /**
     * Ctrl/Cmd + I - 斜体
     */
    'Control-i': (e) => {
      e.preventDefault();
      this.commands.toggleMark('italic');
    },
    'meta-i': (e) => {
      e.preventDefault();
      this.commands.toggleMark('italic');
    },

    /**
     * Ctrl/Cmd + U - 下划线
     */
    'Control-u': (e) => {
      e.preventDefault();
      this.commands.toggleMark('underline');
    },
    'meta-u': (e) => {
      e.preventDefault();
      this.commands.toggleMark('underline');
    },

    /**
     * Ctrl/Cmd + N - 插入音符
     */
    'Control-n': (e) => {
      e.preventDefault();
      this.commands.insertInline('note', {
        noteStr: 'C4',
        editing: true,
      });
    },
    'meta-n': (e) => {
      e.preventDefault();
      this.commands.insertInline('note', {
        noteStr: 'C4',
        editing: true,
      });
    },

    /**
     * Ctrl/Cmd + Shift + N - 插入钢琴卷帘
     */
    'Control-Shift-n': (e) => {
      e.preventDefault();
      this.commands.insertBlock('roll');
    },
    'meta-Shift-n': (e) => {
      e.preventDefault();
      this.commands.insertBlock('roll');
    },

    /**
     * Alt + R - 重置段落格式
     */
    'Alt-r': (e) => {
      e.preventDefault();
      this.commands.removeAllMarks();
      this.commands.toggleBlock('paragraph');
    },

    /**
     * Escape - 移除所有格式
     */
    Escape: (e) => {
      this.commands.removeAllMarks();
    },
  };
}
