'use client'

import React, { useState, Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, Button, Switch, message, Spin } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { MODE } from '@/components/LuvEditor/types'
import styles from './editor.module.scss'

// 预加载函数
const loadLuvEditor = () => import('@/components/LuvEditor')

// 动态导入 LuvEditor 以避免 SSR 问题
const LuvEditor = dynamic(
  loadLuvEditor,
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <Spin size="large" tip="正在加载编辑器..." />
      </div>
    )
  }
)

// 使用 any 类型避免类型问题
type CustomElement = any

/**
 * 富文本编辑器页面 - 企业级产品界面
 */
export default function EditorPage() {
  const [mode, setMode] = useState<MODE>(MODE.EDIT)
  const [content, setContent] = useState<CustomElement[]>([])
  const [editorReady, setEditorReady] = useState(false)

  // 预加载编辑器组件
  useEffect(() => {
    // 预加载编辑器
    loadLuvEditor()
    setEditorReady(true)
  }, [])

  // 处理内容变化
  const handleChange = (data: CustomElement[]) => {
    setContent(data)
  }

  // 切换编辑/查看模式
  const toggleMode = (checked: boolean) => {
    setMode(checked ? MODE.VIEW : MODE.EDIT)
    message.info(checked ? '预览模式' : '编辑模式')
  }

  // 保存内容
  const handleSave = () => {
    console.log('保存内容:', content)
    message.success('内容已保存')
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card} styles={{ body: { padding: 0 } }}>
        {/* 头部 */}
        <div className={styles.header}>
          <div className={styles.title}>
            <h1>音乐编辑器</h1>
            <p className={styles.subtitle}>
              基于 Slate.js 的专业编辑器，支持音符标记与钢琴卷帘
            </p>
          </div>

          <div className={styles.actions}>
            <Switch
              checkedChildren="查看"
              unCheckedChildren="编辑"
              checked={mode === MODE.VIEW}
              onChange={toggleMode}
            />
            {mode === MODE.EDIT && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                保存
              </Button>
            )}
          </div>
        </div>

        {/* 编辑器 - 使用 Suspense 包装 */}
        <div className={styles.editorWrapper}>
          <Suspense fallback={
            <div className={styles.loading}>
              <Spin size="large" tip="正在加载编辑器..." />
            </div>
          }>
            <LuvEditor
              mode={mode}
              onChange={handleChange}
              sticky={0}
            />
          </Suspense>
        </div>

        {/* 功能提示 */}
        <div className={styles.tips}>
          <h3>快捷键与提示</h3>
          <div className={styles.tipsGrid}>
            <div className={styles.tipItem}>
              <strong>文本格式</strong>
              <span>Ctrl+B 加粗 · Ctrl+I 斜体 · Ctrl+U 下划线</span>
            </div>
            <div className={styles.tipItem}>
              <strong>插入音符</strong>
              <span>Ctrl+N 或点击工具栏音符图标</span>
            </div>
            <div className={styles.tipItem}>
              <strong>编辑音符</strong>
              <span>双击音符进入编辑模式</span>
            </div>
            <div className={styles.tipItem}>
              <strong>播放音符</strong>
              <span>预览模式下点击音符即可播放</span>
            </div>
            <div className={styles.tipItem}>
              <strong>撤销 / 重做</strong>
              <span>Ctrl+Z 撤销 · Ctrl+Shift+Z 重做</span>
            </div>
            <div className={styles.tipItem}>
              <strong>块类型</strong>
              <span>标题、列表、引用、代码、钢琴卷帘、视频等</span>
            </div>
          </div>
        </div>

        {/* 状态栏 */}
        <div className={styles.statusBar}>
          <span>
            <span className={`${styles.statusDot} ${mode === MODE.EDIT ? styles['statusDot--edit'] : styles['statusDot--view']}`} />
            {mode === MODE.EDIT ? '编辑中' : '只读'}
          </span>
          <span>{content.length} 个块</span>
        </div>
      </Card>
    </div>
  )
}
