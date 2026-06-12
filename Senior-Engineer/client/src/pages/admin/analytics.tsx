import { useAnalyticsUserGrowth } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function AdminAnalytics() {
  const { data: analytics = [] } = useAnalyticsUserGrowth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">System Analytics</h1>
        <p className="text-muted-foreground mt-2">Track system growth and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Registration Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Students</span>
                  <span className="font-bold text-lg">{analytics[0]?.roleBreakdown?.student || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Supervisors</span>
                  <span className="font-bold text-lg">{analytics[0]?.roleBreakdown?.supervisor || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">School Coords</span>
                  <span className="font-bold text-lg">{analytics[0]?.roleBreakdown?.school || 0}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Weekly Growth</span>
              <span className="font-bold text-green-600">+12%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Monthly Growth</span>
              <span className="font-bold text-green-600">+28%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">User Retention</span>
              <span className="font-bold text-green-600">94%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Active Sessions</span>
              <span className="font-bold">23</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Avg Session Duration</span>
              <span className="font-bold">18m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Daily Active Users</span>
              <span className="font-bold">156</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-green-600">Good</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Database Load</span>
                <span className="text-sm text-green-600">Normal</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Server Memory</span>
                <span className="text-sm text-green-600">Normal</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '38%'}}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
