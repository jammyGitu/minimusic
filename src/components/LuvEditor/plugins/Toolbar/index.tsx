// plugins/Toolbar/index.tsx - 工具栏组件

import React, { useContext, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { CommandsContext, ConfigContext } from '../../context';
import { Commands } from '../../commands';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { MODE } from '../../types';
import styles from './toolbar.module.scss';
import classNames from 'classnames';
import { Tooltip, Button, Divider, Dropdown, Space } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  CodeOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  BlockOutlined,
  AudioOutlined,
  KeyOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';

// 图标按钮组件
interface ToolButtonProps {
  active?: boolean;
  action: () => void;
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
}

const ToolButton = forwardRef<HTMLDivElement, ToolButtonProps>(
  ({ active, action, icon, title, disabled }, ref) => {
    return (
      <Tooltip title={title} placement="bottom">
        <div
          ref={ref}
          className={classNames(
            styles.toolButton,
            active && styles['toolButton--active']
          )}
          onMouseDown={(e) => {
            e.preventDefault(); // 防止失去焦点
            if (!disabled) action();
          }}
        >
          {icon}
        </div>
      </Tooltip>
    );
  }
);

ToolButton.displayName = 'ToolButton';

// 块按钮
interface BlockButtonProps {
  name: string;
  icon: React.ReactNode;
  title: string;
}

const BlockButton = forwardRef<HTMLDivElement, BlockButtonProps>(
  ({ name, icon, title }, ref) => {
    const commands = useContext(CommandsContext);
    
    return (
      <ToolButton
        ref={ref}
        active={commands?.isBlockActive(name)}
        action={() => commands?.toggleBlock(name)}
        icon={icon}
        title={title}
      />
    );
  }
);

BlockButton.displayName = 'BlockButton';

// 标记按钮
interface MarkButtonProps {
  format: string;
  icon: React.ReactNode;
  title: string;
}

const MarkButton = forwardRef<HTMLDivElement, MarkButtonProps>(
  ({ format, icon, title }, ref) => {
    const commands = useContext(CommandsContext);
    
    return (
      <ToolButton
        ref={ref}
        active={commands?.isMarkActive(format)}
        action={() => commands?.toggleMark(format)}
        icon={icon}
        title={title}
      />
    );
  }
);

MarkButton.displayName = 'MarkButton';

// 插入块按钮
interface InsertBlockButtonProps {
  name: string;
  icon: React.ReactNode;
  title: string;
  action?: () => void;
}

const InsertBlockButton = forwardRef<HTMLDivElement, InsertBlockButtonProps>(
  ({ name, icon, title, action }, ref) => {
    const commands = useContext(CommandsContext);
    
    const handleClick = () => {
      if (action) {
        action();
      } else if (commands) {
        commands.insertBlock(name);
      }
    };
    
    return (
      <ToolButton
        ref={ref}
        action={handleClick}
        icon={icon}
        title={title}
      />
    );
  }
);

InsertBlockButton.displayName = 'InsertBlockButton';

// 工具栏 ref 类型
export interface ToolbarRefType {
  update: () => void;
}

interface ToolbarProps {
  sticky?: number;
}

/**
 * 工具栏组件
 */
export const Toolbar = forwardRef<ToolbarRefType, ToolbarProps>(
  (props, ref) => {
    const forceUpdate = useForceUpdate();
    const config = useContext(ConfigContext);
    const isEditMode = config.mode === MODE.EDIT;
    
    // 更新方法
    useImperativeHandle(ref, () => ({
      update: forceUpdate,
    }));
    
    // 插入音符
    const insertNote = useCallback(() => {
      const commands = useContext(CommandsContext);
      commands?.insertInline('note', {
        noteStr: 'C4',
        editing: true,
      });
    }, []);
    
    return (
      <div
        className={classNames(
          styles.toolbar,
          typeof props.sticky === 'number' && styles['toolbar--sticky']
        )}
        style={{
          top: props.sticky,
        }}
      >
        {isEditMode && (
          <>
            {/* 标题格式 */}
            <BlockButton name="heading-one" icon={<span className={styles.textIcon}>H1</span>} title="标题 1" />
            <BlockButton name="heading-two" icon={<span className={styles.textIcon}>H2</span>} title="标题 2" />
            
            <Divider type="vertical" className={styles.divider} />
            
            {/* 文本格式 */}
            <MarkButton format="bold" icon={<BoldOutlined />} title="加粗 (Ctrl+B)" />
            <MarkButton format="italic" icon={<ItalicOutlined />} title="斜体 (Ctrl+I)" />
            <MarkButton format="underline" icon={<UnderlineOutlined />} title="下划线 (Ctrl+U)" />
            <MarkButton format="code" icon={<CodeOutlined />} title="代码" />
            <MarkButton format="link" icon={<LinkOutlined />} title="链接" />
            
            <Divider type="vertical" className={styles.divider} />
            
            {/* 列表 */}
            <BlockButton name="bulleted-list" icon={<UnorderedListOutlined />} title="无序列表" />
            <BlockButton name="numbered-list" icon={<OrderedListOutlined />} title="有序列表" />
            <BlockButton name="block-quote" icon={<BlockOutlined />} title="引用块" />
            
            <Divider type="vertical" className={styles.divider} />
            
            {/* 媒体 */}
            <InsertBlockButton name="img" icon={<PictureOutlined />} title="插入图片" />
            <InsertBlockButton name="bili" icon={<VideoCameraOutlined />} title="插入B站视频" />
            
            <Divider type="vertical" className={styles.divider} />
            
            {/* 音乐功能 */}
            <InsertBlockButton
              name="note"
              icon={<AudioOutlined />}
              title="插入音符 (Ctrl+N)"
              action={insertNote}
            />
            <InsertBlockButton name="roll" icon={<KeyOutlined />} title="插入钢琴卷帘" />
          </>
        )}
      </div>
    );
  }
);

Toolbar.displayName = 'Toolbar';
