"use client";

import React from 'react';
import { 
    format, 
    startOfYear, 
    endOfYear, 
    eachDayOfInterval, 
    isSameDay, 
    getDay, 
    subDays,
    addDays,
    isToday,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeatmapProps {
    data: Record<string, string>; // date string -> status ("present" | "absent")
    year?: number;
}

export function Heatmap({ data, year = new Date().getFullYear() }: HeatmapProps) {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    
    // We want to show a full grid of weeks. 
    // Usually Github heatmap shows 52+ columns.
    // Let's get every day in the year.
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days by week
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Fill first week with nulls if year doesn't start on Sunday (or Monday)
    // standard github heatmap: Sunday is top (0), Saturday is bottom (6).
    const firstDayPadded = startOfWeek(startDate);
    const dayInterval = eachDayOfInterval({ start: firstDayPadded, end: endDate });

    dayInterval.forEach((day, i) => {
        if (i % 7 === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const getStatusColor = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const status = data[dateStr];
        
        if (status === "present") return "bg-green-500 hover:bg-green-600";
        if (status === "absent") return "bg-red-500 hover:bg-red-600";
        return "bg-secondary/20 hover:bg-secondary/40"; // No data
    };

    const monthLabels = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="flex flex-col gap-2 p-6 rounded-2xl border bg-card/50 overflow-x-auto">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Daily Attendance Activity
            </h3>
            
            <div className="flex min-w-max gap-4 p-2">
                {/* Day Labels */}
                <div className="flex flex-col justify-between py-2 text-[10px] text-muted-foreground">
                   {dayLabels.map((day, i) => i % 2 === 1 && <span key={day}>{day}</span>)}
                </div>

                {/* The Grid */}
                <div className="flex flex-col gap-2">
                    {/* Month Labels */}
                    <div className="flex text-[10px] text-muted-foreground ml-0">
                         {/* Simple month label logic: if week index 0 is first of month */}
                         {weeks.map((week, i) => {
                             const firstDay = week[0];
                             if (firstDay.getDate() <= 7) {
                                 return <span key={i} className="w-[14px]">{format(firstDay, 'MMM')}</span>
                             }
                             return <span key={i} className="w-[14px]"></span>
                         })}
                    </div>

                    <div className="flex gap-1">
                        <TooltipProvider delayDuration={0}>
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-1">
                                    {week.map((day, dayIndex) => {
                                        const dateStr = format(day, 'MMM d, yyyy');
                                        const status = data[format(day, 'yyyy-MM-dd')];
                                        const isOutRange = day.getFullYear() !== year;

                                        return (
                                            <Tooltip key={day.toISOString()}>
                                                <TooltipTrigger asChild>
                                                    <div 
                                                        className={cn(
                                                            "w-3 h-3 rounded-[2px] transition-colors cursor-pointer",
                                                            isOutRange ? "opacity-0 pointer-events-none" : getStatusColor(day)
                                                        )}
                                                    />
                                                </TooltipTrigger>
                                                {!isOutRange && (
                                                    <TooltipContent side="top" className="text-[10px] py-1 px-2">
                                                        <span className="font-semibold">{dateStr}</span>
                                                        <br />
                                                        <span className={cn(
                                                            "capitalize",
                                                            status === "present" ? "text-green-500" : status === "absent" ? "text-red-500" : "text-muted-foreground"
                                                        )}>
                                                            {status || "No Session"}
                                                        </span>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ))}
                        </TooltipProvider>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-secondary/20" />
                    <span className="text-[10px] text-muted-foreground">No Session</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-green-500" />
                    <span className="text-[10px] text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-[2px] bg-red-500" />
                    <span className="text-[10px] text-muted-foreground">Absent</span>
                </div>
            </div>
        </div>
    );
}
