"use client";

import React from "react";
import {
    addMonths,
    differenceInCalendarWeeks,
    eachDayOfInterval,
    endOfWeek,
    endOfYear,
    format,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeatmapProps {
    data: Record<string, string>;
    year?: number;
}

const WEEK_STARTS_ON = 1;
const CELL_SIZE = 14;
const CELL_GAP = 4;
const LABEL_COLUMN_WIDTH = 34;

export function Heatmap({ data, year = new Date().getFullYear() }: HeatmapProps) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 11, 31));
    const gridStart = startOfWeek(yearStart, { weekStartsOn: WEEK_STARTS_ON });
    const gridEnd = endOfWeek(yearEnd, { weekStartsOn: WEEK_STARTS_ON });

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const weeks: Date[][] = [];

    for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
    }

    const monthLabels = Array.from({ length: 12 }, (_, month) => {
        const monthStart = startOfMonth(new Date(year, month, 1));
        const nextMonthStart =
            month === 11
                ? addMonths(startOfMonth(new Date(year, month, 1)), 1)
                : startOfMonth(new Date(year, month + 1, 1));

        const startWeek = differenceInCalendarWeeks(monthStart, gridStart, {
            weekStartsOn: WEEK_STARTS_ON,
        });
        const nextMonthWeek = differenceInCalendarWeeks(nextMonthStart, gridStart, {
            weekStartsOn: WEEK_STARTS_ON,
        });

        return {
            label: format(monthStart, "MMM"),
            startWeek,
            span: Math.max(1, nextMonthWeek - startWeek),
        };
    });

    const dayLabels = ["Mon", "Wed", "Fri"];
    const dayLabelRows = [0, 2, 4];

    const presentDays = Object.values(data).filter((value) => value === "present").length;
    const absentDays = Object.values(data).filter((value) => value === "absent").length;
    const trackedDays = presentDays + absentDays;
    const attendanceRate = trackedDays
        ? Math.round((presentDays / trackedDays) * 100)
        : 0;

    const getStatusStyles = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const status = data[dateKey];

        if (status === "present") {
            return "bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] hover:bg-emerald-400";
        }
        if (status === "absent") {
            return "bg-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,0.2)] hover:bg-rose-400";
        }

        return "bg-muted/45 hover:bg-muted/70";
    };

    return (
        <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/70 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="border-b border-border/60 bg-linear-to-r from-emerald-500/10 via-transparent to-sky-500/10 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                            Daily Attendance Activity
                        </p>
                        <h3 className="text-lg font-semibold tracking-tight">
                            Attendance pattern across the full academic year
                        </h3>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Present days glow in green, absences show in red, and empty cells
                            mark days with no recorded session.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <MetricPill label="Tracked" value={trackedDays} tone="neutral" />
                        <MetricPill label="Present" value={presentDays} tone="present" />
                        <MetricPill label="Rate" value={`${attendanceRate}%`} tone="present" />
                    </div>
                </div>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="overflow-x-auto pb-2">
                    <div
                        className="min-w-max"
                        style={{
                            width:
                                LABEL_COLUMN_WIDTH +
                                weeks.length * (CELL_SIZE + CELL_GAP),
                        }}
                    >
                        <div
                            className="mb-3 grid items-end gap-x-1"
                            style={{
                                gridTemplateColumns: `${LABEL_COLUMN_WIDTH}px repeat(${weeks.length}, ${CELL_SIZE}px)`,
                                columnGap: `${CELL_GAP}px`,
                            }}
                        >
                            <div />
                            {monthLabels.map((month) => (
                                <div
                                    key={month.label}
                                    className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/85"
                                    style={{
                                        gridColumn: `${month.startWeek + 2} / span ${month.span}`,
                                    }}
                                >
                                    {month.label}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <div
                                className="grid shrink-0 text-[11px] font-medium text-muted-foreground"
                                style={{
                                    width: LABEL_COLUMN_WIDTH,
                                    gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                                    rowGap: `${CELL_GAP}px`,
                                }}
                            >
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-start"
                                    >
                                        {dayLabelRows.includes(index)
                                            ? dayLabels[dayLabelRows.indexOf(index)]
                                            : ""}
                                    </div>
                                ))}
                            </div>

                            <TooltipProvider delayDuration={0}>
                                <div className="flex gap-1">
                                    {weeks.map((week, weekIndex) => (
                                        <div
                                            key={weekIndex}
                                            className="grid"
                                            style={{
                                                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                                                rowGap: `${CELL_GAP}px`,
                                            }}
                                        >
                                            {week.map((day) => {
                                                const outOfYear = day.getFullYear() !== year;
                                                const dateKey = format(day, "yyyy-MM-dd");
                                                const status = data[dateKey];

                                                return (
                                                    <Tooltip key={day.toISOString()}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={cn(
                                                                    "rounded-[4px] border border-transparent transition-all duration-200",
                                                                    outOfYear
                                                                        ? "opacity-0"
                                                                        : getStatusStyles(day)
                                                                )}
                                                                style={{
                                                                    width: CELL_SIZE,
                                                                    height: CELL_SIZE,
                                                                }}
                                                            />
                                                        </TooltipTrigger>
                                                        {!outOfYear && (
                                                            <TooltipContent
                                                                side="top"
                                                                className="rounded-xl border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
                                                            >
                                                                <p className="font-semibold text-foreground">
                                                                    {format(day, "EEEE, MMM d, yyyy")}
                                                                </p>
                                                                <p
                                                                    className={cn(
                                                                        "mt-1 capitalize",
                                                                        status === "present" &&
                                                                        "text-emerald-500",
                                                                        status === "absent" &&
                                                                        "text-rose-500",
                                                                        !status &&
                                                                        "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {status ?? "No session"}
                                                                </p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <LegendItem label="No Session" className="bg-muted/45" />
                        <LegendItem label="Present" className="bg-emerald-500" />
                        <LegendItem label="Absent" className="bg-rose-500" />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Weekly grid aligned Monday-first for cleaner month symmetry.
                    </p>
                </div>
            </div>
        </div>
    );
}

function MetricPill({
    label,
    value,
    tone,
}: {
    label: string;
    value: string | number;
    tone: "present" | "absent" | "neutral";
}) {
    const toneClass =
        tone === "present"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : tone === "absent"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                : "border-border/70 bg-background/70 text-foreground";

    return (
        <div
            className={cn(
                "rounded-2xl border px-3 py-2 text-center shadow-sm backdrop-blur-sm",
                toneClass
            )}
        >
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
        </div>
    );
}

function LegendItem({
    label,
    className,
}: {
    label: string;
    className: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("h-3.5 w-3.5 rounded-[4px]", className)} />
            <span>{label}</span>
        </div>
    );
}

