"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface DateTimePickerProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    label?: string
    clearable?: boolean
    minDate?: Date
    maxDate?: Date
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = "Select date and time",
    disabled = false,
    className,
    label,
    clearable = false,
    minDate,
    maxDate,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        value ? new Date(value) : undefined
    )
    const [time, setTime] = React.useState<string>(
        value ? format(new Date(value), "HH:mm") : "00:00"
    )

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const [hours, minutes] = time.split(":").map(Number)
            const newDate = new Date(selectedDate)
            newDate.setHours(hours || 0, minutes || 0)
            setDate(newDate)
            onChange?.(newDate.toISOString())
        }
    }

    const handleTimeChange = (newTime: string) => {
        setTime(newTime)
        if (date) {
            const [hours, minutes] = newTime.split(":").map(Number)
            const newDate = new Date(date)
            newDate.setHours(hours || 0, minutes || 0)
            setDate(newDate)
            onChange?.(newDate.toISOString())
        }
    }

    const handleClear = () => {
        setDate(undefined)
        setTime("00:00")
        onChange?.("")
        setOpen(false)
    }

    const displayValue = date && isValid(date)
        ? format(date, "MMM dd, yyyy HH:mm")
        : ""

    return (
        <div className="w-full">
            {label && (
                <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                </div>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all h-11",
                            "flex items-center gap-2 text-left",
                            !displayValue && "text-muted-foreground",
                            disabled && "opacity-50 cursor-not-allowed",
                            className
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {displayValue ? (
                            <span className="flex-1 truncate text-foreground">{displayValue}</span>
                        ) : (
                            <span className="flex-1 truncate">{placeholder}</span>
                        )}
                        {clearable && displayValue && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClear()
                                }}
                                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </span>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="space-y-4">
                        {/* Calendar */}
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            disabled={(date) => {
                                if (minDate && date < minDate) return true
                                if (maxDate && date > maxDate) return true
                                return false
                            }}
                            initialFocus
                            className="mx-auto"
                        />

                        {/* Time Picker */}
                        <div className="border-t p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        className="h-10 w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="border-t p-3 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs h-8"
                                onClick={() => {
                                    const now = new Date()
                                    setDate(now)
                                    setTime(format(now, "HH:mm"))
                                    onChange?.(now.toISOString())
                                }}
                            >
                                Now
                            </Button>
                            {clearable && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs h-8"
                                    onClick={handleClear}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Display selected date as badge */}
            {date && isValid(date) && (
                <div className="mt-2">
                    <Badge variant="secondary" className="gap-1.5 text-xs">
                        <CalendarIcon className="h-3 w-3" />
                        {format(date, "MMM dd, yyyy 'at' HH:mm")}
                    </Badge>
                </div>
            )}
        </div>
    )
}
