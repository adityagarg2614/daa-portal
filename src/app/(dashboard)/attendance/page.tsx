'use client'

import React from "react"
import { CalendarCheck, Clock, CheckCircle2, TrendingUp } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { StatsCard } from "@/components/ui/stats-card"
import { InfoCard } from "@/components/ui/info-card"

export default function AttendancePage() {
    const attendanceStats = [
        {
            title: "Current Attendance",
            value: "82%",
            subtitle: "Overall percentage",
            icon: CalendarCheck,
        },
        {
            title: "Classes Attended",
            value: "45/55",
            subtitle: "This semester",
            icon: CheckCircle2,
        },
        {
            title: "Attendance Trend",
            value: "+5%",
            subtitle: "Last 30 days",
            icon: TrendingUp,
        },
        {
            title: "Remaining Classes",
            value: "10",
            subtitle: "To maintain 75%",
            icon: Clock,
        },
    ]

    const monthlyData = [
        { month: "January", attendance: 85, classes: "17/20" },
        { month: "February", attendance: 80, classes: "16/20" },
        { month: "March", attendance: 82, classes: "12/15" },
    ]

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <SectionHeader
                title="Attendance"
                description="Track your class attendance and maintain the required percentage"
                icon={CalendarCheck}
            />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Attendance statistics">
                {attendanceStats.map((item) => (
                    <StatsCard
                        key={item.title}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                        subtitle={item.subtitle}
                    />
                ))}
            </div>

            {/* Monthly Breakdown */}
            <InfoCard title="Monthly Breakdown" icon={CalendarCheck}>
                <div className="space-y-4">
                    {monthlyData.map((data, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                        >
                            <div>
                                <h3 className="font-semibold">{data.month}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Classes: {data.classes}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-32 rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: `${data.attendance}%` }}
                                    />
                                </div>
                                <span className="w-12 text-right font-semibold">
                                    {data.attendance}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </InfoCard>

            {/* Important Information */}
            <InfoCard title="Important Information" icon={Clock}>
                <div className="space-y-3 text-sm">
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="font-medium">Minimum Required Attendance</p>
                        <p className="mt-1 text-muted-foreground">
                            Students must maintain a minimum of 75% attendance to be eligible for exams.
                        </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="font-medium">Attendance Calculation</p>
                        <p className="mt-1 text-muted-foreground">
                            Attendance is calculated based on the total number of classes held versus the number of classes attended.
                        </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="font-medium">Shortage Condonation</p>
                        <p className="mt-1 text-muted-foreground">
                            In case of medical emergencies, please submit appropriate documentation to the administration for consideration.
                        </p>
                    </div>
                </div>
            </InfoCard>

            {/* Coming Soon Notice */}
            <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold">Live Attendance Tracking</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Real-time attendance marking and tracking feature is coming soon.
                </p>
            </div>
        </div>
    )
}
