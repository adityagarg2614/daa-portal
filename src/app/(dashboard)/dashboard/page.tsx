'use client'

import React from "react"
import { useUser } from "@clerk/nextjs"
import { BookOpen, Clock, Trophy, CalendarCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/ui/section-header"
import { StatsCard } from "@/components/ui/stats-card"
import { InfoCard } from "@/components/ui/info-card"

export default function DashboardPage() {
  const { user } = useUser()

  const stats = [
    {
      title: "Total Assignments",
      value: "12",
      subtitle: "This semester",
      icon: BookOpen,
    },
    {
      title: "Pending",
      value: "3",
      subtitle: "Need submission",
      icon: Clock,
    },
    {
      title: "Average Score",
      value: "78%",
      subtitle: "Overall performance",
      icon: Trophy,
    },
    {
      title: "Attendance",
      value: "82%",
      subtitle: "Current status",
      icon: CalendarCheck,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
      {/* Enhanced Header */}
      <SectionHeader
        title={`Welcome back, ${user?.firstName || "Student"} 👋`}
        description="Manage your assignments and track your progress"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Statistics">
        {stats.map((item) => (
          <StatsCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <InfoCard title="Quick Actions">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/assignment"
            className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Assignments</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                View all assignments
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/submission"
            className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Submissions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Track submissions
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/results"
            className="group flex items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Results</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                View your grades
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </InfoCard>
    </div>
  )
}
