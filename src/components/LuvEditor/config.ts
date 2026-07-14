// config.ts - 编辑器配置和初始值

import { Descendant } from 'slate';
import { CustomElement } from './types';

// 主题配置
export const theme = {
  primary: '#3a4f61',
  secondary: '#7c3aed',
  accent: '#10b981',
};

// 编辑器初始值
export const initialValue: Descendant[] = [
  {
    type: 'heading-one',
    id: 'heading-1',
    children: [{ text: '欢迎使用音乐编辑器' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: '这是一个专业的' },
      { text: '富文本编辑器', bold: true },
      { text: '，支持丰富的文本格式化和音乐相关功能。' },
    ],
  },
  {
    type: 'heading-two',
    id: 'heading-2',
    children: [{ text: '✨ 主要功能' }],
  },
  {
    type: 'bulleted-list',
    children: [
      {
        type: 'list-item',
        children: [{ text: '支持多种标题格式（H1、H2）' }],
      },
      {
        type: 'list-item',
        children: [{ text: '插入音符块和钢琴卷帘片段' }],
      },
      {
        type: 'list-item',
        children: [{ text: '支持图片和B站视频嵌入' }],
      },
      {
        type: 'list-item',
        children: [{ text: '丰富的文本格式化选项' }],
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: '🎵 音乐是灵魂的语言，让编辑器成为你的音乐创作伙伴！' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: '试试在下方输入音符吧！双击 ' },
      { type: 'note', noteStr: 'C4', children: [{ text: '' }] } as CustomElement,
      { text: ' 音符可以编辑，' },
      { type: 'note', noteStr: 'D4', children: [{ text: '' }] } as CustomElement,
      { text: ' 点击音符可以播放。' },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: '开始创作你的音乐笔记吧！' }],
  },
] as unknown as Descendant[];

// 快捷键配置
export const SHORTCUTS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

// 快捷键到命令的映射
export const SHORTCUT_COMMANDS: Record<string, () => void> = {};
