import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import Skeleton from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div>
      <PageHeader title="Loading…" />

      <div className="max-w-6xl mx-auto px-5">
        <Card clip>
          <div className="px-4 py-3 border-b border-sand/60 flex gap-4">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          <div className="divide-y divide-sand/40">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
