import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import Skeleton from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div>
      <PageHeader title="My Profile" maxWidth="max-w-5xl" />

      <div className="max-w-2xl mx-auto px-5 space-y-5">
        <Card className="p-5 flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-52" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    </div>
  )
}
