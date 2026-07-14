// plugins/Img/index.tsx - 图片块插件

import React, { useContext, useState, memo, useCallback } from 'react';
import { Transforms, Element } from 'slate';
import { useSelected } from 'slate-react';
import { CommandsContext, ConfigContext } from '../../context';
import { BlockWrapper } from '../../nodes';
import { CustomElement, MODE } from '../../types';
import styles from './img.module.scss';
import { Input, Upload, Button, message } from 'antd';
import { PictureOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';

interface ImgElement extends CustomElement {
  type: 'img';
  url?: string;
  error?: boolean;
}

/**
 * 图片块组件 - 使用 memo 优化
 */
export const ImgBlock = memo((props: any) => {
  const { attributes, children, element } = props;
  const imgElement = element as ImgElement;
  const commands = useContext(CommandsContext);
  const editor = commands?.editor;
  const config = useContext(ConfigContext);
  
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const selected = useSelected();
  const isView = config.mode === MODE.VIEW;
  const url = imgElement.url;
  
  // 更新 URL - 使用 useCallback
  const updateUrl = useCallback((newUrl: string) => {
    if (!editor) return;
    
    setImageError(false);
    Transforms.setNodes(
      editor,
      { url: newUrl, error: false } as Partial<CustomElement>,
      { match: (n) => Element.isElement(n) && (n as any).type === 'img' }
    );
  }, [editor]);
  
  // 处理 URL 提交 - 使用 useCallback
  const handleUrlSubmit = useCallback(() => {
    if (inputUrl.trim() && editor) {
      setIsLoading(true);
      updateUrl(inputUrl.trim());
      setIsLoading(false);
      message.success('图片已添加');
    }
  }, [inputUrl, editor, updateUrl]);
  
  // 处理图片加载错误 - 使用 useCallback
  const handleImageError = useCallback(() => {
    if (!editor) return;
    
    setImageError(true);
    Transforms.setNodes(
      editor,
      { error: true } as Partial<CustomElement>,
      { match: (n) => Element.isElement(n) && (n as any).type === 'img' }
    );
  }, [editor]);
  
  // 删除图片 - 使用 useCallback
  const handleDelete = useCallback(() => {
    if (!editor) return;
    
    Transforms.removeNodes(editor, {
      match: (n) => Element.isElement(n) && (n as any).type === 'img'
    });
  }, [editor]);
  
  // URL 输入变化处理
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
  }, []);
  
  // 未设置 URL - 显示输入界面
  if (!url) {
    return (
      <BlockWrapper attributes={attributes} selected={selected}>
        <div className={styles.inputContainer}>
          <div className={styles.placeholder}>
            <PictureOutlined className={styles.icon} />
            <p>添加图片</p>
          </div>
          
          {!isView && (
            <>
              <div className={styles.inputRow}>
                <Input
                  value={inputUrl}
                  onChange={handleUrlChange}
                  placeholder="输入图片 URL..."
                  onPressEnter={handleUrlSubmit}
                  className={styles.urlInput}
                />
                <Button
                  type="primary"
                  onClick={handleUrlSubmit}
                  loading={isLoading}
                >
                  添加
                </Button>
              </div>
              
              <div className={styles.divider}>
                <span>或</span>
              </div>
              
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const result = e.target?.result as string;
                    updateUrl(result);
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>
                  上传图片
                </Button>
              </Upload>
            </>
          )}
        </div>
        {children}
      </BlockWrapper>
    );
  }
  
  // 图片加载错误
  if (imageError || imgElement.error) {
    return (
      <BlockWrapper attributes={attributes} selected={selected}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <p>图片加载失败</p>
          {!isView && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除
            </Button>
          )}
        </div>
        {children}
      </BlockWrapper>
    );
  }
  
  // 正常显示图片
  return (
    <BlockWrapper attributes={attributes} selected={selected}>
      <div className={styles.imageWrapper}>
        <img
          src={url}
          alt=""
          className={styles.image}
          onError={handleImageError}
        />
      </div>
      {children}
    </BlockWrapper>
  );
});

ImgBlock.displayName = 'ImgBlock';
