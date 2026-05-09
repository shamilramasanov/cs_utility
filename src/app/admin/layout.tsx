import AdminSecretField from '@/components/admin/AdminSecretField'

/**
 * Изолированный контейнер с вертикальным скроллом: глобальные стили задают body { overflow:hidden },
 * поэтому длинные списки (позиции, формы) в админке должны скроллиться здесь или внутри карты.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y">
        <div className="px-app-screen pt-3 max-w-3xl">
          <AdminSecretField />
        </div>
        {children}
      </div>
    </div>
  )
}
