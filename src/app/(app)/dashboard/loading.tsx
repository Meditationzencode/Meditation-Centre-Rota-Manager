import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import Skeleton from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <PageHeader title="Loading…" />

      <div className="max-w-6xl mx-auto px-5 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} className="px-4 py-4 flex items-center gap-3.5">
              <Skeleton className="w-11 h-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
          ))}
        </div>

        {/* Two-column lists */}
        <div className="grid lg:grid-cols-2 gap-6 lg:items-start">
          {[0, 1].map(i => (
            <Card key={i} clip>
              <div className="px-5 py-4 border-b border-sand/60">
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="divide-y divide-sand/40">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="h-3 w-12" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
