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
import { Search, Download, X, Shield, Users, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { exportUsersToCSV } from "@/lib/admin/users-utils";
import { cn } from "@/lib/utils";

interface UsersFiltersProps {
    searchValue: string;
    onSearchChange: (search: string) => void;
    onSortChange: (sortBy: string, order: string) => void;
    onRoleFilterChange: (role: string) => void;
    users: Array<{
        name: string | null;
        email: string | null;
        role: "admin" | "student";
        rollNo: string | null;
        createdAt: string;
    }>;
    roleFilter: string;
    userCounts?: {
        all: number;
        admin: number;
        student: number;
    };
}

export function UsersFilters({
    searchValue,
    onSearchChange,
    onSortChange,
    onRoleFilterChange,
    users,
    roleFilter,
    userCounts,
}: UsersFiltersProps) {
    const [localSearchValue, setLocalSearchValue] = useState(searchValue);
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");

    useEffect(() => {
        if (localSearchValue === searchValue) {
            return;
        }

        const timer = window.setTimeout(() => {
            onSearchChange(localSearchValue);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [localSearchValue, onSearchChange, searchValue]);

    const handleSortChange = (value: string) => {
        const [field, sortOrder] = value.split("-");
        setSortBy(field);
        setOrder(sortOrder);
        onSortChange(field, sortOrder);
    };

    const handleExport = () => {
        exportUsersToCSV(users, `users_${new Date().toISOString().split("T")[0]}.csv`);
    };

    const handleClearFilters = () => {
        setLocalSearchValue("");
        setSortBy("createdAt");
        setOrder("desc");
        onSearchChange("");
        onSortChange("createdAt", "desc");
        onRoleFilterChange("all");
    };

    const roles = [
        { value: "all", label: "All", icon: Users, count: userCounts?.all },
        { value: "admin", label: "Admins", icon: Shield, count: userCounts?.admin },
        { value: "student", label: "Students", icon: GraduationCap, count: userCounts?.student },
    ];

    return (
        <div className="space-y-4">
            {/* Role Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {roles.map((role) => {
                    const Icon = role.icon;
                    const isActive = roleFilter === role.value;
                    return (
                        <button
                            key={role.value}
                            onClick={() => onRoleFilterChange(role.value)}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            aria-pressed={isActive}
                        >
                            <Icon className="h-4 w-4" />
                            {role.label}
                            {role.count !== undefined && (
                                <span className={cn(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    isActive ? "bg-primary-foreground/20" : "bg-background/50"
                                )}>
                                    {role.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by name, email, or roll number..."
                        value={localSearchValue}
                        onChange={(e) => setLocalSearchValue(e.target.value)}
                        className="pl-9 h-9"
                    />
                    {localSearchValue && (
                        <button
                            type="button"
                            onClick={() => setLocalSearchValue("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Sort */}
                    <Select value={`${sortBy}-${order}`} onValueChange={handleSortChange}>
                        <SelectTrigger size="sm" className="w-40 h-9">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt-desc">Newest First</SelectItem>
                            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                            <SelectItem value="role-asc">Role (Admin First)</SelectItem>
                            <SelectItem value="role-desc">Role (Student First)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Export Button */}
                    <Button onClick={handleExport} variant="outline" size="sm" className="h-9 gap-1.5">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>

                    {/* Clear Filters */}
                    {(localSearchValue || roleFilter !== "all" || sortBy !== "createdAt") && (
                        <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-9">
                            Clear
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
