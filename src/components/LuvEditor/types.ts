// types.ts - Slate 编辑器类型定义

// Roll 数据类型
export interface RollData {
  timeLength: number;
  currentTrack: string;
  tracks: TrackData[];
}

export interface TrackData {
  range?: [string, string];
  instrument: string;
  notes: NoteData[];
  name?: string;
  color?: string;
}

export interface NoteData {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
  tip?: string;
}

// 自定义元素类型
export interface CustomElement {
  type: string;
  id?: string;
  children: CustomText[];
  // Roll 块数据
  data?: Partial<RollData>;
  // 图片数据
  url?: string;
  // 音符数据
  noteStr?: string;
  editing?: boolean;
  // 代码块
  pre?: boolean;
  // 链接
  link?: string;
  href?: string;
}

// 自定义文本类型
export interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  link?: boolean;
}

// 块类型列表
export const BLOCK_TYPES = [
  'paragraph',
  'heading-one',
  'heading-two',
  'block-quote',
  'bulleted-list',
  'numbered-list',
  'list-item',
  'code-block',
] as const;

// 块类型
export type BlockType = typeof BLOCK_TYPES[number];

// 标记类型
export const MARK_TYPES = ['bold', 'italic', 'underline', 'code', 'link'] as const;
export type MarkType = typeof MARK_TYPES[number];

// 特殊块类型
export const VOID_TYPES = ['img', 'roll', 'bili', 'note'] as const;
export type VoidType = typeof VOID_TYPES[number];

// 工具栏模式
export enum MODE {
  EDIT = 'EDIT',
  VIEW = 'VIEW',
}
