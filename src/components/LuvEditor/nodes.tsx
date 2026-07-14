// nodes.tsx - Slate 节点渲染组件

import React, { useContext, memo } from 'react';
import { RenderElementProps, RenderLeafProps, useSelected, useFocused } from 'slate-react';
import { Transforms, Element } from 'slate';
import { ConfigContext, CommandsContext } from './context';
import { CustomElement, CustomText, MODE } from './types';
import styles from './nodes.module.scss';
import classNames from 'classnames';

// ==================== 默认元素 ====================

/**
 * 默认段落元素 - 使用 memo 优化
 */
export const DefaultElement = memo((props: RenderElementProps) => {
  return <p {...props.attributes}>{props.children}</p>;
});

DefaultElement.displayName = 'DefaultElement';

// ==================== 块级元素 ====================

/**
 * 标题 1 - 使用 memo 优化
 */
export const HeadingOne = memo((props: RenderElementProps) => {
  const element = props.element as CustomElement;
  return (
    <h1 
      {...props.attributes} 
      id={element.id}
      className={styles.heading1}
    >
      {props.children}
    </h1>
  );
});

HeadingOne.displayName = 'HeadingOne';

/**
 * 标题 2 - 使用 memo 优化
 */
export const HeadingTwo = memo((props: RenderElementProps) => {
  const element = props.element as CustomElement;
  return (
    <h2 
      {...props.attributes} 
      id={element.id}
      className={styles.heading2}
    >
      {props.children}
    </h2>
  );
});

HeadingTwo.displayName = 'HeadingTwo';

/**
 * 块引用 - 使用 memo 优化
 */
export const BlockQuote = memo((props: RenderElementProps) => {
  return (
    <blockquote {...props.attributes} className={styles.blockQuote}>
      {props.children}
    </blockquote>
  );
});

BlockQuote.displayName = 'BlockQuote';

/**
 * 项目列表 - 使用 memo 优化
 */
export const BulletedList = memo((props: RenderElementProps) => {
  return (
    <ul {...props.attributes} className={styles.bulletedList}>
      {props.children}
    </ul>
  );
});

BulletedList.displayName = 'BulletedList';

/**
 * 编号列表 - 使用 memo 优化
 */
export const NumberedList = memo((props: RenderElementProps) => {
  return (
    <ol {...props.attributes} className={styles.numberedList}>
      {props.children}
    </ol>
  );
});

NumberedList.displayName = 'NumberedList';

/**
 * 列表项 - 使用 memo 优化
 */
export const ListItem = memo((props: RenderElementProps) => {
  return (
    <li {...props.attributes} className={styles.listItem}>
      {props.children}
    </li>
  );
});

ListItem.displayName = 'ListItem';

/**
 * 代码块 - 使用 memo 优化
 */
export const CodeBlock = memo((props: RenderElementProps) => {
  return (
    <pre {...props.attributes} className={styles.codeBlock}>
      <code>{props.children}</code>
    </pre>
  );
});

CodeBlock.displayName = 'CodeBlock';

// ==================== 块包装器 ====================

/**
 * 块级元素包装器（用于 void 元素）- 使用 memo 优化
 */
export const BlockWrapper = memo((props: {
  attributes: any;
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
}) => {
  const { attributes, children, selected, className } = props;
  const config = useContext(ConfigContext);
  const isView = config.mode === MODE.VIEW;

  return (
    <div
      {...attributes}
      contentEditable={false}
      className={classNames(
        styles.blockWrapper,
        selected && styles['blockWrapper--selected'],
        className
      )}
    >
      <div
        className={styles.blockContent}
        style={{
          pointerEvents: selected || isView ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
});

BlockWrapper.displayName = 'BlockWrapper';

// ==================== Leaf 渲染 ====================

/**
 * Leaf 渲染（文本格式化）- 使用 memo 优化
 */
export const Leaf = memo(({ attributes, children, leaf }: RenderLeafProps) => {
  const config = useContext(ConfigContext);
  const customLeaf = leaf as CustomText;

  // 加粗
  if (customLeaf.bold) {
    children = <strong>{children}</strong>;
  }

  // 斜体
  if (customLeaf.italic) {
    children = <em>{children}</em>;
  }

  // 下划线
  if (customLeaf.underline) {
    children = <u>{children}</u>;
  }

  // 代码
  if (customLeaf.code) {
    children = <code className={styles.inlineCode}>{children}</code>;
  }

  // 链接
  if (customLeaf.link && config.linkComp) {
    children = React.createElement(
      config.linkComp as any,
      { href: (customLeaf as any).href || customLeaf.text, children },
      null
    );
  } else if (customLeaf.link) {
    children = (
      <a 
        href={(customLeaf as any).href || customLeaf.text} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.link}
      >
        {children}
      </a>
    );
  }

  return <span {...attributes}>{children}</span>;
});

Leaf.displayName = 'Leaf';

// ==================== 节点名称映射 ====================

export type NodeName = 
  | 'paragraph'
  | 'heading-one'
  | 'heading-two'
  | 'block-quote'
  | 'bulleted-list'
  | 'numbered-list'
  | 'list-item'
  | 'code-block'
  | 'note'
  | 'roll'
  | 'img'
  | 'bili';

export const nameToCompMap: Record<string, React.FC<any>> = {
  paragraph: DefaultElement,
  'heading-one': HeadingOne,
  'heading-two': HeadingTwo,
  'block-quote': BlockQuote,
  'bulleted-list': BulletedList,
  'numbered-list': NumberedList,
  'list-item': ListItem,
  'code-block': CodeBlock,
};

/**
 * 渲染元素
 */
export const renderElement = (props: RenderElementProps) => {
  const { element } = props;
  const elementType = (element as CustomElement).type as NodeName;

  if (nameToCompMap[elementType]) {
    const Comp = nameToCompMap[elementType];
    return <Comp {...props} />;
  }

  return <DefaultElement {...props} />;
};

/**
 * 渲染 Leaf
 */
export const renderLeaf = (props: RenderLeafProps) => {
  return <Leaf {...props} />;
};
