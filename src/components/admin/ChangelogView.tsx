'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'

function inlineToHtml(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#F0B429] font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-[#2a2a2a] px-1.5 py-0.5 rounded text-[#e0e0e0] font-mono">$1</code>')
}

export default function ChangelogView({ markdown }: { markdown: string }) {
  const t = useT()
  const lines = markdown.split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (list.length === 0) return
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-2 text-[#ccc] text-sm leading-relaxed my-3">
        {list.map((item, i) => (
          // eslint-disable-next-line react/no-danger -- контент только из репозитория ADMIN_CHANGELOG.md
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineToHtml(item) }} />
        ))}
      </ul>,
    )
    list = []
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()

    if (line.trim() === '') {
      flushList()
      continue
    }

    const ttrim = line.trim()
    if (ttrim === '---') {
      flushList()
      blocks.push(<hr key={`hr-${key++}`} className="border-[#333] my-8" />)
      continue
    }

    if (ttrim.startsWith('## ')) {
      flushList()
      blocks.push(
        <h2 key={`h2-${key++}`} className="text-xl font-bold text-white mt-8 mb-3 first:mt-0">
          {ttrim.slice(3)}
        </h2>,
      )
      continue
    }

    if (ttrim.startsWith('### ')) {
      flushList()
      blocks.push(
        <h3 key={`h3-${key++}`} className="text-lg font-semibold text-[#e8e8e8] mt-6 mb-2">
          {ttrim.slice(4)}
        </h3>,
      )
      continue
    }

    if (ttrim.startsWith('- ') || ttrim.startsWith('* ')) {
      list.push(ttrim.replace(/^[-*]\s+/, ''))
      continue
    }

    if (ttrim.startsWith('```')) {
      flushList()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push(
        <pre
          key={`pre-${key++}`}
          className="overflow-x-auto text-xs bg-[#111] border border-[#2a2a2a] rounded-xl p-4 my-4 text-[#bbb] font-mono leading-snug"
        >
          {codeLines.join('\n')}
        </pre>,
      )
      continue
    }

    flushList()
    // eslint-disable-next-line react/no-danger
    blocks.push(
      <p
        key={`p-${key++}`}
        className="text-sm text-[#b5b5b5] leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: inlineToHtml(line) }}
      />,
    )
  }
  flushList()

  return (
    <div className="mx-auto max-w-3xl px-app-screen pb-16 pt-4 text-white">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href="/admin"
          className="inline-flex px-3 py-1.5 rounded-lg bg-[#222] text-sm text-[#F0B429] no-underline"
        >
          ← {t('admin.changelogBack')}
        </Link>
      </div>
      <header className="mb-8 border-b border-[#2a2a2a] pb-6">
        <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">Admin</p>
        <h1 className="text-2xl font-bold">{t('admin.changelogTitle')}</h1>
        <p className="text-sm text-[#888] mt-2 leading-snug">{t('admin.changelogLead')}</p>
        <p className="text-xs text-[#555] mt-3 font-mono">ADMIN_CHANGELOG.md</p>
      </header>
      <article className="changelog-body">{blocks}</article>
    </div>
  )
}
