'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, Button, Space, Tooltip, message } from 'antd'
import { 
  BoldOutlined, ItalicOutlined, UnderlineOutlined, 
  UnorderedListOutlined, OrderedListOutlined, 
  LinkOutlined, PictureOutlined, MessageOutlined,
  UndoOutlined, RedoOutlined, AudioOutlined,
  FileTextOutlined, LayoutOutlined, TableOutlined,
  KeyOutlined, VideoCameraOutlined
} from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'

// 类型定义
interface EditorNode {
  id: string
  type: NodeType
  children?: EditorNode[]
  text?: string
  data?: any
  // 格式化标记
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  link?: string
}

type NodeType = 
  | 'paragraph' 
  | 'heading-one' 
  | 'heading-two' 
  | 'heading-three'
  | 'block-quote' 
  | 'bulleted-list' 
  | 'numbered-list'
  | 'list-item'
  | 'note' 
  | 'roll' 
  | 'image'
  | 'video'
  | 'code-block'

// 常量
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * 专业富文本编辑器
 * 参考 twomoons LuvEditor 实现，基于 Slate.js 架构思想
 */
export default function RichTextEditor() {
  // 编辑器状态
  const [nodes, setNodes] = useState<EditorNode[]>([
    { id: '1', type: 'heading-one', children: [{ id: '1-1', type: 'paragraph', text: '欢迎使用音乐编辑器' }] },
    { id: '2', type: 'paragraph', children: [{ id: '2-1', type: 'paragraph', text: '这是一个专业的音乐学习编辑器，支持丰富的文本格式化和音乐相关功能。' }] },
    { id: '3', type: 'heading-two', children: [{ id: '3-1', type: 'paragraph', text: '✨ 主要功能' }] },
    { id: '4', type: 'bulleted-list', children: [
      { id: '4-1', type: 'list-item', text: '支持多种标题格式' },
      { id: '4-2', type: 'list-item', text: '插入音符块和钢琴卷帘' },
      { id: '4-3', type: 'list-item', text: '插入图片和视频' },
      { id: '4-4', type: 'list-item', text: '代码块和引用块' },
    ]},
    { id: '5', type: 'block-quote', children: [{ id: '5-1', type: 'paragraph', text: '🎵 音乐是灵魂的语言' }] },
    { id: '6', type: 'note', data: { note: 'C4', duration: 0.5 }, text: 'C4' },
    { id: '7', type: 'paragraph', children: [{ id: '7-1', type: 'paragraph', text: '开始创作你的音乐笔记吧！' }] },
  ])
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [history, setHistory] = useState<EditorNode[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isEditing, setIsEditing] = useState(true)
  const [linkModalVisible, setLinkModalVisible] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  
  const editorRef = useRef<HTMLDivElement>(null)
  
  // 保存到历史记录
  const saveToHistory = useCallback((newNodes: EditorNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newNodes)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])
  
  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setNodes(JSON.parse(JSON.stringify(history[historyIndex - 1])))
    }
  }, [history, historyIndex])
  
  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setNodes(JSON.parse(JSON.stringify(history[historyIndex + 1])))
    }
  }, [history, historyIndex])
  
  // 更新节点文本
  const updateNodeText = useCallback((nodeId: string, text: string) => {
    const updateNode = (nodes: EditorNode[]): EditorNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, text }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    
    const newNodes = updateNode(nodes)
    setNodes(newNodes)
  }, [nodes])
  
  // 提交更改到历史记录
  const commitChange = useCallback(() => {
    saveToHistory(nodes)
  }, [nodes, saveToHistory])
  
  // 插入新节点
  const insertNode = useCallback((type: NodeType, afterId?: string) => {
    const newNode: EditorNode = {
      id: `node-${Date.now()}`,
      type,
      text: '',
      data: type === 'note' ? { note: 'C4', duration: 0.5 } : 
           type === 'roll' ? { notes: [], timeLength: 16 } :
           type === 'image' ? { url: '' } :
           type === 'video' ? { url: '' } : undefined,
    }
    
    if (afterId) {
      const index = nodes.findIndex(n => n.id === afterId)
      const newNodes = index >= 0 
        ? [...nodes.slice(0, index + 1), newNode, ...nodes.slice(index + 1)]
        : [...nodes, newNode]
      setNodes(newNodes)
      saveToHistory(newNodes)
    } else {
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      saveToHistory(newNodes)
    }
    
    setSelectedNodeId(newNode.id)
  }, [nodes, saveToHistory])
  
  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    if (nodes.length <= 1) return
    const newNodes = nodes.filter(n => n.id !== nodeId)
    setNodes(newNodes)
    saveToHistory(newNodes)
    setSelectedNodeId(null)
  }, [nodes, saveToHistory])
  
  // 切换块类型
  const toggleBlock = useCallback((type: NodeType) => {
    if (!selectedNodeId) {
      message.warning('请先选择一个段落')
      return
    }
    
    const newNodes = nodes.map(node => {
      if (node.id === selectedNodeId) {
        return { ...node, type }
      }
      return node
    })
    
    setNodes(newNodes)
    saveToHistory(newNodes)
  }, [nodes, selectedNodeId, saveToHistory])
  
  // 播放音符
  const playNote = useCallback((note: string, duration: number = 0.5) => {
    moaTone.playNote(note, duration)
  }, [])
  
  // 快速插入音符
  const quickInsertNote = useCallback((note: string) => {
    const newNode: EditorNode = {
      id: `note-${Date.now()}`,
      type: 'note',
      text: note,
      data: { note, duration: 0.5 }
    }
    
    const insertIndex = selectedNodeId 
      ? nodes.findIndex(n => n.id === selectedNodeId) + 1 
      : nodes.length
    
    const newNodes = [...nodes.slice(0, insertIndex), newNode, ...nodes.slice(insertIndex)]
    setNodes(newNodes)
    saveToHistory(newNodes)
    playNote(note)
  }, [nodes, selectedNodeId, saveToHistory, playNote])
  
  // 更新音符块数据
  const updateNoteData = useCallback((nodeId: string, note: string) => {
    const newNodes = nodes.map(node => {
      if (node.id === nodeId && node.type === 'note') {
        return { ...node, text: note, data: { ...node.data, note } }
      }
      return node
    })
    setNodes(newNodes)
  }, [nodes])
  
  // 更新图片URL
  const updateImageUrl = useCallback((nodeId: string, url: string) => {
    const newNodes = nodes.map(node => {
      if (node.id === nodeId && node.type === 'image') {
        return { ...node, data: { ...node.data, url } }
      }
      return node
    })
    setNodes(newNodes)
    saveToHistory(newNodes)
  }, [nodes, saveToHistory])
  
  // 更新视频URL
  const updateVideoUrl = useCallback((nodeId: string, url: string) => {
    const newNodes = nodes.map(node => {
      if (node.id === nodeId && node.type === 'video') {
        return { ...node, data: { ...node.data, url } }
      }
      return node
    })
    setNodes(newNodes)
    saveToHistory(newNodes)
  }, [nodes, saveToHistory])
  
  // 渲染单个节点
  const renderNode = (node: EditorNode, index: number) => {
    const isSelected = selectedNodeId === node.id
    
    const nodeProps = {
      className: `group relative transition-all ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:bg-gray-50'}`,
      onClick: () => setSelectedNodeId(node.id),
    }
    
    switch (node.type) {
      case 'heading-one':
        return (
          <div key={node.id} {...nodeProps}>
            <h1 className="text-3xl font-bold p-2">
              <input
                type="text"
                value={node.children?.[0]?.text || ''}
                onChange={(e) => {
                  const newNodes = nodes.map(n => {
                    if (n.id === node.id) {
                      return { ...n, children: [{ id: `${node.id}-1`, type: 'paragraph' as NodeType, text: e.target.value }] }
                    }
                    return n
                  })
                  setNodes(newNodes)
                }}
                onBlur={commitChange}
                className="w-full bg-transparent outline-none"
                placeholder="标题 1"
              />
            </h1>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'heading-two':
        return (
          <div key={node.id} {...nodeProps}>
            <h2 className="text-2xl font-bold p-2">
              <input
                type="text"
                value={node.children?.[0]?.text || ''}
                onChange={(e) => {
                  const newNodes = nodes.map(n => {
                    if (n.id === node.id) {
                      return { ...n, children: [{ id: `${node.id}-1`, type: 'paragraph' as NodeType, text: e.target.value }] }
                    }
                    return n
                  })
                  setNodes(newNodes)
                }}
                onBlur={commitChange}
                className="w-full bg-transparent outline-none"
                placeholder="标题 2"
              />
            </h2>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'heading-three':
        return (
          <div key={node.id} {...nodeProps}>
            <h3 className="text-xl font-bold p-2">
              <input
                type="text"
                value={node.children?.[0]?.text || ''}
                onChange={(e) => {
                  const newNodes = nodes.map(n => {
                    if (n.id === node.id) {
                      return { ...n, children: [{ id: `${node.id}-1`, type: 'paragraph' as NodeType, text: e.target.value }] }
                    }
                    return n
                  })
                  setNodes(newNodes)
                }}
                onBlur={commitChange}
                className="w-full bg-transparent outline-none"
                placeholder="标题 3"
              />
            </h3>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'paragraph':
        return (
          <div key={node.id} {...nodeProps}>
            <p className="p-2">
              <textarea
                value={node.children?.[0]?.text || ''}
                onChange={(e) => {
                  const newNodes = nodes.map(n => {
                    if (n.id === node.id) {
                      return { ...n, children: [{ id: `${node.id}-1`, type: 'paragraph' as NodeType, text: e.target.value }] }
                    }
                    return n
                  })
                  setNodes(newNodes)
                }}
                onBlur={commitChange}
                className="w-full bg-transparent outline-none resize-none"
                placeholder="输入文本..."
                rows={Math.max(1, (node.children?.[0]?.text || '').split('\n').length)}
              />
            </p>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'block-quote':
        return (
          <div key={node.id} {...nodeProps}>
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 italic text-gray-600 bg-gray-50">
              <textarea
                value={node.children?.[0]?.text || ''}
                onChange={(e) => {
                  const newNodes = nodes.map(n => {
                    if (n.id === node.id) {
                      return { ...n, children: [{ id: `${node.id}-1`, type: 'paragraph' as NodeType, text: e.target.value }] }
                    }
                    return n
                  })
                  setNodes(newNodes)
                }}
                onBlur={commitChange}
                className="w-full bg-transparent outline-none resize-none italic"
                placeholder="引用内容..."
                rows={Math.max(1, (node.children?.[0]?.text || '').split('\n').length)}
              />
            </blockquote>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'bulleted-list':
        return (
          <div key={node.id} {...nodeProps} className="p-2">
            <ul className="list-disc list-inside space-y-1">
              {(node.children || []).map((item, i) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <input
                    type="text"
                    value={item.text || ''}
                    onChange={(e) => {
                      const newChildren = (node.children || []).map((c, ci) => 
                        ci === i ? { ...c, text: e.target.value } : c
                      )
                      const newNodes = nodes.map(n => 
                        n.id === node.id ? { ...n, children: newChildren } : n
                      )
                      setNodes(newNodes)
                    }}
                    onBlur={commitChange}
                    className="flex-1 bg-transparent outline-none"
                    placeholder="列表项"
                  />
                  <button
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      const newChildren = (node.children || []).filter((_, ci) => ci !== i)
                      const newNodes = nodes.map(n => 
                        n.id === node.id ? { ...n, children: newChildren } : n
                      )
                      setNodes(newNodes)
                      saveToHistory(newNodes)
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <Button
              size="small"
              type="dashed"
              className="mt-2"
              onClick={() => {
                const newChildren = [...(node.children || []), { id: `item-${Date.now()}`, type: 'list-item' as NodeType, text: '' }]
                const newNodes = nodes.map(n => 
                  n.id === node.id ? { ...n, children: newChildren } : n
                )
                setNodes(newNodes)
                saveToHistory(newNodes)
              }}
            >
              + 添加列表项
            </Button>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'note':
        return (
          <div key={node.id} {...nodeProps} className="p-2">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-2xl">🎵</span>
              <input
                type="text"
                value={node.text || ''}
                onChange={(e) => updateNoteData(node.id, e.target.value)}
                onBlur={commitChange}
                className="flex-1 bg-transparent outline-none font-mono text-lg"
                placeholder="输入音符，如: C4, D#5, F#3..."
              />
              <Button
                type="primary"
                size="small"
                onClick={() => playNote(node.text || 'C4')}
              >
                播放
              </Button>
            </div>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'roll':
        return (
          <div key={node.id} {...nodeProps} className="p-2">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">🎹 钢琴卷帘片段</span>
                <Space>
                  <Button size="small">编辑</Button>
                  <Button size="small" danger>清空</Button>
                </Space>
              </div>
              <div className="flex gap-1 h-20 bg-white rounded p-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 flex-1 bg-gray-100 rounded-b cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      const note = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'][i % 12]
                      playNote(note, 0.2)
                    }}
                  />
                ))}
              </div>
            </div>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'image':
        return (
          <div key={node.id} {...nodeProps} className="p-2">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              {node.data?.url ? (
                <img 
                  src={node.data.url} 
                  alt="" 
                  className="max-w-full rounded-lg mx-auto"
                  style={{ maxHeight: 400 }}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <PictureOutlined className="text-4xl mb-2" />
                  <p>点击添加图片URL</p>
                </div>
              )}
              <input
                type="text"
                value={node.data?.url || ''}
                onChange={(e) => updateImageUrl(node.id, e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded"
                placeholder="输入图片URL..."
              />
            </div>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      case 'video':
        return (
          <div key={node.id} {...nodeProps} className="p-2">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              {node.data?.url ? (
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <VideoCameraOutlined className="text-6xl text-white" />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <VideoCameraOutlined className="text-4xl mb-2" />
                  <p>点击添加视频URL</p>
                </div>
              )}
              <input
                type="text"
                value={node.data?.url || ''}
                onChange={(e) => updateVideoUrl(node.id, e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded"
                placeholder="输入视频URL（支持B站、YouTube等）..."
              />
            </div>
            {isSelected && renderDeleteButton(node.id)}
          </div>
        )
        
      default:
        return null
    }
  }
  
  // 渲染删除按钮
  const renderDeleteButton = (nodeId: string) => (
    <button
      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity z-10"
      onClick={(e) => {
        e.stopPropagation()
        deleteNode(nodeId)
      }}
    >
      ✕
    </button>
  )
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">📝 富文本编辑器</h2>
            <p className="text-gray-500 text-sm mt-1">支持音乐内容的富文本编辑</p>
          </div>
          <Space>
            <Button icon={<UndoOutlined />} onClick={undo} disabled={historyIndex <= 0} />
            <Button icon={<RedoOutlined />} onClick={redo} disabled={historyIndex >= history.length - 1} />
          </Space>
        </div>
        
        {/* 工具栏 */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-2 mb-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-1">
            {/* 标题 */}
            <Tooltip title="标题 1">
              <Button
                icon={<FileTextOutlined />}
                onClick={() => insertNode('heading-one', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="标题 2">
              <Button
                icon={<LayoutOutlined />}
                onClick={() => insertNode('heading-two', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="标题 3">
              <Button
                icon={<TableOutlined />}
                onClick={() => insertNode('heading-three', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* 文本格式化 */}
            <Tooltip title="粗体">
              <Button icon={<BoldOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="斜体">
              <Button icon={<ItalicOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="下划线">
              <Button icon={<UnderlineOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="链接">
              <Button icon={<LinkOutlined />} size="small" />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* 块级元素 */}
            <Tooltip title="无序列表">
              <Button
                icon={<UnorderedListOutlined />}
                onClick={() => insertNode('bulleted-list', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="有序列表">
              <Button
                icon={<OrderedListOutlined />}
                onClick={() => insertNode('numbered-list', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="引用块">
              <Button
                icon={<MessageOutlined />}
                onClick={() => insertNode('block-quote', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* 媒体 */}
            <Tooltip title="插入图片">
              <Button
                icon={<PictureOutlined />}
                onClick={() => insertNode('image', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="插入视频">
              <Button
                icon={<VideoCameraOutlined />}
                onClick={() => insertNode('video', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            {/* 音乐 */}
            <Tooltip title="插入音符块">
              <Button
                type="primary"
                icon={<AudioOutlined />}
                onClick={() => insertNode('note', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="插入钢琴卷帘">
              <Button
                icon={<KeyOutlined />}
                onClick={() => insertNode('roll', selectedNodeId || undefined)}
                size="small"
              />
            </Tooltip>
          </div>
        </div>
        
        {/* 音符快捷插入栏 */}
        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-sm text-yellow-700 font-medium mr-2">🎵 快速插入音符:</span>
          {NOTE_NAMES.flatMap((note, i) => [
            <Button
              key={note}
              size="small"
              onClick={() => quickInsertNote(`${note}4`)}
              className="font-mono min-w-[40px]"
            >
              {note}4
            </Button>,
            i < NOTE_NAMES.length - 1 && NOTE_NAMES[i + 1].includes('#') ? null : null
          ])}
          <div className="w-px h-6 bg-yellow-300 mx-1" />
          {['C3', 'C4', 'C5', 'C6'].map(octave => (
            <Button
              key={octave}
              size="small"
              onClick={() => quickInsertNote(octave)}
              className="font-mono"
            >
              {octave}
            </Button>
          ))}
        </div>
        
        {/* 编辑区域 */}
        <div 
          ref={editorRef}
          className="min-h-[400px] border border-gray-200 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-400"
        >
          {nodes.map((node, index) => renderNode(node, index))}
          
          {/* 添加段落按钮 */}
          <Button
            type="dashed"
            block
            className="mt-4"
            onClick={() => insertNode('paragraph')}
          >
            + 添加段落
          </Button>
        </div>
        
        {/* 状态栏 */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div>节点数量: {nodes.length}</div>
          <div>当前选中: {selectedNodeId || '无'}</div>
          <div>历史记录: {history.length} 步</div>
        </div>
        
        {/* 操作提示 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">💡 使用提示</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>• 点击节点进行编辑</div>
            <div>• 使用工具栏插入内容</div>
            <div>• 点击音符块播放按钮试听</div>
            <div>• 快捷栏一键插入音符</div>
            <div>• Ctrl+Z 撤销 / Ctrl+Shift+Z 重做</div>
            <div>• 支持图片、视频、钢琴卷帘</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
