// index.ts - LuvEditor 入口文件

import React, { useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { createEditor, Descendant, Editor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Commands } from './commands';
import { CommandsContext, ConfigContext } from './context';
import { EventHandler, ToolbarRefType } from './eventHandler';
import { renderElement, renderLeaf } from './nodes';
import { withPlugins } from './plugin';
import { initialValue, theme } from './config';
import { Toolbar } from './plugins/Toolbar';
import { Note } from './plugins/Note';
import { Roll } from './plugins/Roll';
import { BiliBlock } from './plugins/Bili';
import { ImgBlock } from './plugins/Img';
import { MODE, CustomElement } from './types';
import styles from './index.module.scss';

const defaultProps = {
  mode: MODE.EDIT,
  initialValue,
};

interface LuvEditorProps {
  mode?: MODE;
  initialValue?: Descendant[];
  sticky?: number;
  onChange?: (data: CustomElement[]) => void;
  editorRef?: React.RefObject<Editor>;
  linkComp?: React.FC<any>;
  className?: string;
}

/**
 * 自定义元素渲染器 - 使用 memo 优化
 */
const CustomElementRenderer = memo((props: any) => {
  const element = props.element as CustomElement;
  
  switch (element.type) {
    case 'note':
      return <Note {...props} />;
    case 'roll':
      return <Roll {...props} />;
    case 'bili':
      return <BiliBlock {...props} />;
    case 'img':
      return <ImgBlock {...props} />;
    default:
      return renderElement(props);
  }
});

CustomElementRenderer.displayName = 'CustomElementRenderer';

/**
 * 富文本编辑器组件
 */
const LuvEditor: React.FC<LuvEditorProps> = (props) => {
  const mergedProps = Object.assign(defaultProps, props);
  
  const toolbarRef = useRef<ToolbarRefType>(null);
  
  // 使用 useMemo 创建编辑器实例 - 避免重复创建
  const editor = useMemo(() => withPlugins(createEditor()), []);
  
  // 创建命令实例 - 使用 useMemo 依赖 editor
  const commands = useMemo(() => new Commands(editor), [editor]);
  
  // 创建事件处理器 - 使用 useCallback 包装 onChange
  const handleChange = useCallback((newData: CustomElement[]) => {
    if (mergedProps.onChange) {
      mergedProps.onChange(newData);
    }
  }, [mergedProps.onChange]);
  
  const eventHandler = useMemo(
    () =>
      new EventHandler(commands, {
        mode: mergedProps.mode,
        toolbarRef,
        onChange: handleChange,
      }),
    [commands, mergedProps.mode, handleChange]
  );
  
  // 设置命令到编辑器
  useEffect(() => {
    (editor as any).commands = commands;
    
    if (mergedProps.editorRef && 'current' in mergedProps.editorRef) {
      (mergedProps.editorRef as React.MutableRefObject<Editor>).current = editor;
    }
  }, [editor, commands, mergedProps.editorRef]);
  
  // 渲染元素 - 使用 useCallback 避免每次渲染都创建新函数
  const renderElementFn = useCallback((renderProps: any) => <CustomElementRenderer {...renderProps} />, []);
  
  // 渲染 Leaf - 使用 useCallback
  const renderLeafFn = useCallback((renderProps: any) => renderLeaf(renderProps), []);
  
  return (
    <Slate
      editor={editor}
      initialValue={mergedProps.initialValue as Descendant[]}
      onChange={(value) => eventHandler.onChange(value as any)}
    >
      <CommandsContext.Provider value={commands}>
        <ConfigContext.Provider
          value={{
            theme,
            linkComp: mergedProps.linkComp,
            mode: mergedProps.mode,
          }}
        >
          {mergedProps.mode === MODE.EDIT && (
            <Toolbar ref={toolbarRef} sticky={mergedProps.sticky} />
          )}
          
          <Editable
            autoFocus
            readOnly={mergedProps.mode === MODE.VIEW}
            className={`${styles.editor} ${mergedProps.className || ''}`}
            renderElement={renderElementFn}
            renderLeaf={renderLeafFn}
            onKeyDown={eventHandler.onKeyDown}
            onKeyUp={eventHandler.onKeyUp}
            onPaste={eventHandler.onPaste}
            placeholder="输入内容..."
            spellCheck
          />
        </ConfigContext.Provider>
      </CommandsContext.Provider>
    </Slate>
  );
};

export default LuvEditor;
export { Commands } from './commands';
export { CommandsContext, ConfigContext } from './context';
export * from './types';
