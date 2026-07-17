// plugins/Bili/index.tsx - B 站视频块插件

import React, { useContext, useRef, useState, memo, useCallback } from 'react';
import { Transforms, Element } from 'slate';
import { useSelected } from 'slate-react';
import { CommandsContext, ConfigContext } from '../../context';
import { BlockWrapper } from '../../nodes';
import { CustomElement, MODE } from '../../types';
import styles from './bili.module.scss';
import { Button, Input } from 'antd';

interface BiliElement extends CustomElement {
  type: 'bili';
  url?: string;
}

/**
 * 从 B 站分享代码中提取 URL
 */
const extractBiliUrl = (input: string): string | null => {
  // 匹配 iframe src
  const iframeMatch = input.match(/src="([^"]+)"/);
  if (iframeMatch) {
    return iframeMatch[1] + '&autoplay=0';
  }
  
  // 匹配 BV 号
  const bvMatch = input.match(/BV[\w]+/);
  if (bvMatch) {
    return `//player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0`;
  }
  
  // 匹配 av 号
  const avMatch = input.match(/av(\d+)/);
  if (avMatch) {
    return `//player.bilibili.com/player.html?aid=${avMatch[1]}&autoplay=0`;
  }
  
  // 如果是完整的 URL
  if (input.startsWith('http')) {
    return input;
  }
  
  return null;
};

/**
 * B 站视频块组件 - 使用 memo 优化
 */
export const BiliBlock = memo((props: any) => {
  const { attributes, children, element } = props;
  const biliElement = element as BiliElement;
  const commands = useContext(CommandsContext);
  const editor = commands?.editor;
  const config = useContext(ConfigContext);
  
  const inputRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const selected = useSelected();
  const isView = config.mode === MODE.VIEW;
  const url = biliElement.url;
  
  // 更新 URL - 使用 useCallback
  const updateUrl = useCallback((newUrl: string) => {
    if (editor) {
      Transforms.setNodes(
        editor,
        { url: newUrl } as Partial<CustomElement>,
        { match: (n) => Element.isElement(n) && (n as any).type === 'bili' }
      );
    }
  }, [editor]);
  
  // 处理提交 - 使用 useCallback
  const handleSubmit = useCallback(() => {
    const extractedUrl = extractBiliUrl(inputValue);
    
    if (extractedUrl) {
      setIsLoading(true);
      updateUrl(extractedUrl);
      setIsLoading(false);
    }
  }, [inputValue, updateUrl]);
  
  // 处理键盘事件 - 使用 useCallback
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);
  
  // 输入变化处理
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);
  
  // 嵌入代码模式
  if (!url) {
    return (
      <BlockWrapper attributes={attributes} selected={selected}>
        <div className={styles.inputContainer}>
          <div className={styles.biliIcon}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.355.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.553.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
            </svg>
          </div>
          <Input.TextArea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="粘贴 B 站视频链接、嵌入代码或 BV 号..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            className={styles.input}
          />
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
            className={styles.submitBtn}
          >
            嵌入视频
          </Button>
        </div>
        {children}
      </BlockWrapper>
    );
  }
  
  // 显示视频
  return (
    <BlockWrapper attributes={attributes} selected={selected}>
      <div className={styles.videoContainer}>
        <iframe
          src={url}
          className={styles.iframe}
          scrolling="no"
          frameBorder="no"
          allowFullScreen
        />
      </div>
      {children}
    </BlockWrapper>
  );
});

BiliBlock.displayName = 'BiliBlock';
