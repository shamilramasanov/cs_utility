import { redirect } from 'next/navigation'

export default function TeamNewPage() {
  redirect('/team?create=1')
}
