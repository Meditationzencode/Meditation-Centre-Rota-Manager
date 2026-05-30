import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import Skeleton from '@/components/ui/skeleton'

export default function RotaLoading() {
  return (
    <div>
      <PageHeader title="Rota" subtitle="Loading…" maxWidth="max-w-7xl" />

      <div className="max-w-7xl mx-auto px-5 space-y-5">
        <Card className="px-5 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-12" />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col">
              <div className="text-center bg-paper-100 border border-sand/60 rounded-t-lg px-2 py-2.5">
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
              <div className="flex-1 border border-t-0 border-sand/60 rounded-b-lg p-1.5 space-y-1.5 min-h-[80px] bg-white">
                {[0, 1, 2].map(j => (
                  <div key={j} className="border border-sand/50 rounded-md p-2 space-y-1">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
