'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface VideoAnalyticsProps {
  videoId: string
}

interface AnalyticsData {
  totalViews: number
  averageWatchTime: number
  averageWatchPercentage: number
  viewsByCountry: Record<string, number>
  analytics: Array<{
    watchTime: number
    watchPercentage: number
    viewedAt: string
    viewerCountry: string
  }>
}

export function VideoAnalytics({ videoId }: VideoAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/videos/${videoId}/analytics`)
        setData(response.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [videoId])

  if (loading) {
    return <div>Loading analytics...</div>
  }

  if (!data) {
    return <div>No analytics data available</div>
  }

  // Prepare data for charts
  const watchTimeData = data.analytics.map((item) => ({
    time: new Date(item.viewedAt).toLocaleDateString(),
    watchTime: Math.round(item.watchTime / 60), // Convert to minutes
  }))

  const retentionData = data.analytics.map((item) => ({
    time: new Date(item.viewedAt).toLocaleDateString(),
    retention: Math.round(item.watchPercentage),
  }))

  const countryData = Object.entries(data.viewsByCountry).map(([country, views]) => ({
    country,
    views,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Watch Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.averageWatchTime / 60)} minutes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.averageWatchPercentage)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watch Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Watch Time Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={watchTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="watchTime"
                  stroke="#8884d8"
                  name="Minutes Watched"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Retention Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="#82ca9d"
                  name="Retention %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Views by Country */}
      <Card>
        <CardHeader>
          <CardTitle>Views by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 