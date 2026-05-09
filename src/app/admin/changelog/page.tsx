import fs from 'fs'
import path from 'path'
import ChangelogView from '@/components/admin/ChangelogView'

/** Читать MD с диска каждый запрос — изменения в ADMIN_CHANGELOG.md видны без пересборки. */
export const dynamic = 'force-dynamic'

export default function AdminChangelogPage() {
  const file = path.join(process.cwd(), 'ADMIN_CHANGELOG.md')
  const markdown = fs.readFileSync(file, 'utf8')
  return <ChangelogView markdown={markdown} />
}
