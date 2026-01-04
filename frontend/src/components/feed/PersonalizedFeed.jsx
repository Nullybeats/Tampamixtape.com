import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  Music,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useFeed, useMyActivity, useFollowingActivity } from '@/hooks/useFeed'
import { ActivityItem } from './ActivityItem'
import { ReleaseCard } from './ReleaseCard'

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function FeedSection({ items, loading, error, emptyTitle, emptyDescription, onLoadMore, hasMore }) {
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <ActivityItem key={item.id || index} activity={item} index={index} />
      ))}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export function PersonalizedFeed() {
  const { items: allItems, loading: allLoading, error: allError, hasMore, loadMore, refetch } = useFeed()
  const { items: myItems, loading: myLoading, error: myError } = useMyActivity()
  const { items: followingItems, loading: followingLoading, error: followingError } = useFollowingActivity()

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Activity Feed
          </span>
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="all" className="text-xs">
              All Activity
            </TabsTrigger>
            <TabsTrigger value="mine" className="text-xs">
              My Releases
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs">
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <FeedSection
              items={allItems}
              loading={allLoading}
              error={allError}
              emptyTitle="No activity yet"
              emptyDescription="Your feed will show releases from you and artists you follow"
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </TabsContent>

          <TabsContent value="mine">
            <FeedSection
              items={myItems.map(item => ({
                ...item,
                artistName: 'You',
                message: `released "${item.name}"`,
                timestamp: item.timestamp
              }))}
              loading={myLoading}
              error={myError}
              emptyTitle="No releases yet"
              emptyDescription="Your releases will appear here"
              hasMore={false}
            />
          </TabsContent>

          <TabsContent value="following">
            <FeedSection
              items={followingItems}
              loading={followingLoading}
              error={followingError}
              emptyTitle="No activity from followed artists"
              emptyDescription="Follow some artists to see their activity here"
              hasMore={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
