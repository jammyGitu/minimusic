// plugin.ts - Slate.js 插件系统

import { Editor, Element } from 'slate';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { flow } from 'lodash';
import { CustomElement } from './types';

/**
 * 图片插件
 */
export const withImg = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element: Element) => {
    return (element as CustomElement).type === 'img' ? true : isVoid(element);
  };

  return editor;
};

/**
 * Roll（钢琴卷帘）插件
 */
export const withRollPlugin = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element: Element) => {
    return (element as CustomElement).type === 'roll' ? true : isVoid(element);
  };

  return editor;
};

/**
 * 音符插件
 */
export const withNotePlugin = (editor: Editor) => {
  const { isVoid, isInline } = editor;

  editor.isVoid = (element: Element) => {
    return (element as CustomElement).type === 'note' ? true : isVoid(element);
  };

  editor.isInline = (element: Element) => {
    return (element as CustomElement).type === 'note' ? true : isInline(element);
  };

  return editor;
};

/**
 * B站视频插件
 */
export const withBiliPlugin = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element: Element) => {
    return (element as CustomElement).type === 'bili' ? true : isVoid(element);
  };

  return editor;
};

/**
 * 组合所有插件
 */
export const withPlugins = (editor: Editor) => {
  return flow([
    withHistory,     // 历史记录（撤销/重做）
    withReact,       // React 支持
    withRollPlugin,  // 钢琴卷帘
    withBiliPlugin,  // B站视频
    withNotePlugin,  // 音符
    withImg,         // 图片
  ])(editor);
};
