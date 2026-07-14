// plugins/Note/index.tsx - 音符插件

import React, { useContext, useRef, useEffect, useState, memo, useCallback } from 'react';
import { Editor, Transforms, Element } from 'slate';
import { useSelected, useFocused, ReactEditor } from 'slate-react';
import { CommandsContext, ConfigContext } from '../../context';
import { CustomElement, MODE } from '../../types';
import { moaTone } from '@/utils/MoaTone';
import styles from './note.module.scss';
import classNames from 'classnames';

interface NoteElement extends CustomElement {
  type: 'note';
  noteStr: string;
  editing?: boolean;
}

/**
 * 音符元素组件 - 使用 memo 优化
 */
export const Note = memo((props: any) => {
  const { attributes, children, element } = props;
  const noteElement = element as NoteElement;
  const commands = useContext(CommandsContext);
  const editor = commands?.editor;
  const config = useContext(ConfigContext);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const selected = useSelected();
  const focused = useFocused();
  
  const isEditing = noteElement.editing;
  const noteStr = noteElement.noteStr || 'C4';
  
  // 样式 - 使用 useMemo 避免每次渲染都创建新对象
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '4px',
    boxShadow: selected && focused ? `0 0 0 2px ${config.theme?.primary || '#3a4f61'}` : 'none',
    transition: 'all 0.2s ease',
  };
  
  // 播放音符 - 使用 useCallback
  const playNote = useCallback(() => {
    if (config.mode === MODE.VIEW) {
      setIsPlaying(true);
      moaTone.playNote(noteStr, 0.5);
      setTimeout(() => setIsPlaying(false), 500);
    }
  }, [config.mode, noteStr]);
  
  // 处理编辑完成 - 使用 useCallback
  const handleEditComplete = useCallback((value: string) => {
    if (!editor) return;
    
    // 验证音符格式
    if (/^[A-Ga-g][#b]?[0-8]$/.test(value)) {
      Transforms.setNodes(
        editor,
        { 
          noteStr: value.toUpperCase(),
          editing: false 
        } as Partial<CustomElement>,
        { match: (n) => Element.isElement(n) && (n as any).type === 'note' }
      );
      
      // 播放新音符
      moaTone.playNote(value.toUpperCase(), 0.5);
    } else {
      // 无效格式，重置为原始值
      Transforms.setNodes(
        editor,
        { editing: false } as Partial<CustomElement>,
        { match: (n) => Element.isElement(n) && (n as any).type === 'note' }
      );
    }
  }, [editor]);
  
  // 双击进入编辑模式 - 使用 useCallback
  const handleDoubleClick = useCallback(() => {
    if (!editor || config.mode === MODE.VIEW) return;
    
    Transforms.setNodes(
      editor,
      { editing: true } as Partial<CustomElement>,
      { match: (n) => Element.isElement(n) && (n as any).type === 'note' }
    );
  }, [editor, config.mode]);
  
  // 自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // 输入框键盘事件处理 - 使用 useCallback
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleEditComplete((e.target as HTMLInputElement).value);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editor) {
        Transforms.setNodes(
          editor,
          { editing: false } as Partial<CustomElement>,
          { match: (n) => Element.isElement(n) && (n as any).type === 'note' }
        );
      }
    }
    // 只允许音符字符
    if (!/[CDEFGABcdefgab#0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  }, [handleEditComplete, editor]);
  
  // 输入框失焦处理
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    handleEditComplete(e.target.value);
  }, [handleEditComplete]);
  
  // 点击处理
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (config.mode === MODE.VIEW) {
      e.preventDefault();
      playNote();
    }
  }, [config.mode, playNote]);
  
  return (
    <span 
      {...attributes} 
      className={classNames(
        styles.note,
        selected && focused && styles['note--selected'],
        isPlaying && styles['note--playing']
      )}
      style={style}
      onClick={handleClick}
    >
      {/* 播放图标 */}
      <span className={styles.playIcon} onClick={playNote}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </span>
      
      {/* 编辑模式 */}
      {isEditing ? (
        <input
          ref={inputRef}
          className={styles.input}
          defaultValue={noteStr}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
        />
      ) : (
        /* 查看模式 - 显示音符 */
        <span 
          className={styles.noteText}
          onDoubleClick={handleDoubleClick}
          title={config.mode === MODE.EDIT ? '双击编辑' : '点击播放'}
        >
          {noteStr}
        </span>
      )}
      
      {children}
    </span>
  );
});

Note.displayName = 'Note';

/**
 * 音符快捷键处理
 */
export const onKeyDown = (
  e: React.KeyboardEvent<HTMLDivElement>,
  commands: any
) => {
  const editor = commands?.editor;
  if (!editor) return;
  
  const { selection } = editor;

  if (e.key === 'Enter') {
    const [node] = Editor.nodes(editor, {
      match: (n) => Element.isElement(n) && (n as any).type === 'note',
    });

    if (node) {
      // 在音符节点内按回车，切换到编辑模式
      Transforms.setNodes(
        editor,
        { editing: true } as Partial<CustomElement>,
        { match: (n) => Element.isElement(n) && (n as any).type === 'note' }
      );
    }
  }
};
