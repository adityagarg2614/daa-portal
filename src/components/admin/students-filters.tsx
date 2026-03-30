"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { exportStudentsToCSV } from "@/lib/admin/students-utils";

interface StudentsFiltersProps {
    onSearchChange: (search: string) => void;
    onStatusChange: (status: string) => void;
    onSortChange: (sortBy: string, order: string) => void;
    students: any[];
}

export function StudentsFilters({
    onSearchChange,
    onStatusChange,
    onSortChange,
    students,
}: StudentsFiltersProps) {
    const [searchValue, setSearchValue] = useState("");
    const [status, setStatus] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [order, setOrder] = useState("asc");

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(searchValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue, onSearchChange]);

    const handleStatusChange = (value: string) => {
        setStatus(value);
        onStatusChange(value);
    };

    const handleSortChange = (value: string) => {
        const [field, sortOrder] = value.split("-");
        setSortBy(field);
        setOrder(sortOrder);
        onSortChange(field, sortOrder);
    };

    const handleExport = () => {
        exportStudentsToCSV(students, `students_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const handleClearFilters = () => {
        setSearchValue("");
        setStatus("all");
        setSortBy("name");
        setOrder("asc");
        onSearchChange("");
        onStatusChange("all");
        onSortChange("name", "asc");
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search by name, email, or roll number..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9 h-9"
                />
                {searchValue && (
                    <button
                        onClick={() => setSearchValue("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger size="sm" className="w-32 h-9">
                        <Filter className="h-4 w-4 mr-1" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={`${sortBy}-${order}`} onValueChange={handleSortChange}>
                    <SelectTrigger size="sm" className="w-40 h-9">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="rollNo-asc">Roll No (1-Z)</SelectItem>
                        <SelectItem value="rollNo-desc">Roll No (Z-1)</SelectItem>
                        <SelectItem value="totalScore-desc">Score (High-Low)</SelectItem>
                        <SelectItem value="totalScore-asc">Score (Low-High)</SelectItem>
                        <SelectItem value="totalSubmissions-desc">Submissions (High-Low)</SelectItem>
                        <SelectItem value="totalSubmissions-asc">Submissions (Low-High)</SelectItem>
                        <SelectItem value="averageScore-desc">Avg Score (High-Low)</SelectItem>
                        <SelectItem value="averageScore-asc">Avg Score (Low-High)</SelectItem>
                        <SelectItem value="lastActive-desc">Last Active (Recent)</SelectItem>
                        <SelectItem value="lastActive-asc">Last Active (Oldest)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Export Button */}
                <Button onClick={handleExport} variant="outline" size="sm" className="h-9 gap-1.5">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                </Button>

                {/* Clear Filters */}
                {(searchValue || status !== "all") && (
                    <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-9">
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}
