import type { ReactNode } from 'react'

type MarkdownTextProps = {
  text: string
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return part
  })
}

function flushList(items: string[], blocks: ReactNode[]) {
  if (items.length === 0) {
    return
  }

  blocks.push(
    <ul key={`list-${blocks.length}`}>
      {items.map((item, index) => (
        <li key={index}>{renderInline(item)}</li>
      ))}
    </ul>,
  )
  items.length = 0
}

function MarkdownText({ text }: MarkdownTextProps) {
  const blocks: ReactNode[] = []
  const listItems: string[] = []

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()

    if (!line) {
      flushList(listItems, blocks)
      return
    }

    if (line.startsWith('### ')) {
      flushList(listItems, blocks)
      blocks.push(<h4 key={`h4-${blocks.length}`}>{renderInline(line.slice(4))}</h4>)
      return
    }

    if (line.startsWith('## ')) {
      flushList(listItems, blocks)
      blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(line.slice(3))}</h3>)
      return
    }

    if (line.startsWith('# ')) {
      flushList(listItems, blocks)
      blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(line.slice(2))}</h3>)
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
      return
    }

    flushList(listItems, blocks)
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line)}</p>)
  })

  flushList(listItems, blocks)

  return <div className="markdown-text">{blocks}</div>
}

export default MarkdownText
