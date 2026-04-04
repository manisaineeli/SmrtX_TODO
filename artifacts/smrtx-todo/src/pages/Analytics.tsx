import { useGetProductivityAnalytics, useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Analytics() {
  const { data: productivity, isLoading: loadingProductivity } = useGetProductivityAnalytics();
  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboardAnalytics();

  const isLoading = loadingProductivity || loadingDashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  const weeklyData = dashboard?.weeklyTaskData || productivity || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Productivity Score</CardDescription>
            <CardTitle className="text-4xl">{dashboard?.productivityScore ?? 0}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
            <CardTitle className="text-4xl">{dashboard?.streak ?? 0} days</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks Today</CardDescription>
            <CardTitle className="text-4xl">{dashboard?.tasksCompletedToday ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Focus Time Today</CardDescription>
            <CardTitle className="text-4xl">{dashboard?.focusMinutesToday ?? 0}m</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Focus History</CardTitle>
            <CardDescription>Focus minutes per day (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {weeklyData && weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="focusMinutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Focus Minutes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
            <CardDescription>Completed vs Created tasks (last 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {weeklyData && weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="created" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Created" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {dashboard?.tasksByPriority && dashboard.tasksByPriority.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of active tasks across priority levels</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.tasksByPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="priority" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
