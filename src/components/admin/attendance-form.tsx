"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    CalendarDays,
    CheckCheck,
    Loader2,
    Save,
    Search,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { getIndiaDateKey } from "@/lib/attendance-date";

interface Student {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
}

interface ExistingSession {
    _id: string;
    title: string;
    date: string;
    type: "class" | "assignment";
    records: { userId: string; present: boolean }[];
}

interface AttendanceFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialSession?: ExistingSession | null;
}

export function AttendanceForm({
    onSuccess,
    onCancel,
    initialSession = null,
}: AttendanceFormProps) {
    const defaultTitle = initialSession?.title || `Class - ${new Date().toLocaleDateString()}`;
    const defaultDate =
        (initialSession?.date ? getIndiaDateKey(initialSession.date) : undefined) ||
        getIndiaDateKey();
    const defaultPresentIds = new Set(
        initialSession?.records
            ?.filter((record) => record.present)
            .map((record) => record.userId) || []
    );

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [title, setTitle] = useState(defaultTitle);
    const [date, setDate] = useState(defaultDate);
    const [presentIds, setPresentIds] = useState<Set<string>>(defaultPresentIds);

    const isEditing = Boolean(initialSession);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch("/api/admin/students?limit=1000");
                const data = await res.json();

                if (data.success) {
                    setStudents(data.data.students);
                } else {
                    toast.error(data.message || "Failed to load students");
                }
            } catch {
                toast.error("Failed to load students");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = useMemo(
        () =>
            students.filter(
                (student) =>
                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [students, searchQuery]
    );

    const presentCount = presentIds.size;
    const absentCount = Math.max(0, students.length - presentCount);
    const filteredSelectedCount = filteredStudents.filter((student) =>
        presentIds.has(student._id)
    ).length;

    const allFilteredSelected =
        filteredStudents.length > 0 && filteredSelectedCount === filteredStudents.length;

    const toggleStudent = (id: string) => {
        const next = new Set(presentIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setPresentIds(next);
    };

    const toggleFiltered = (checked: boolean) => {
        const next = new Set(presentIds);

        filteredStudents.forEach((student) => {
            if (checked) {
                next.add(student._id);
            } else {
                next.delete(student._id);
            }
        });

        setPresentIds(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !date) {
            toast.error("Please fill in the session title and date");
            return;
        }

        setSubmitting(true);

        try {
            const records = students.map((student) => ({
                userId: student._id,
                present: presentIds.has(student._id),
            }));

            const url = isEditing
                ? `/api/admin/attendance/${initialSession?._id}`
                : "/api/admin/attendance";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    date,
                    records,
                    type: initialSession?.type || "class",
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(
                    isEditing
                        ? "Attendance session updated successfully"
                        : "Attendance recorded successfully"
                );
                onSuccess();
            } else {
                toast.error(data.message || "Failed to save attendance");
            }
        } catch {
            toast.error("An error occurred while saving attendance");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-[24px] border border-border/60 bg-card/70 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Session Setup
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight">
                                {isEditing
                                    ? "Edit attendance session"
                                    : "Create a new attendance session"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Set the session title, date, and then mark present students from
                                the list below.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-500">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Session Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. DAA Lecture #12"
                                className="h-11 rounded-2xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-11 rounded-2xl"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                    <FormMetricCard
                        label="Present"
                        value={presentCount}
                        helper="Currently marked present"
                        tone="emerald"
                    />
                    <FormMetricCard
                        label="Absent"
                        value={absentCount}
                        helper="Will be stored as absent"
                        tone="rose"
                    />
                    <FormMetricCard
                        label="Students"
                        value={students.length}
                        helper="Loaded for this session"
                        tone="slate"
                    />
                </div>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-card/75 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Student Marking
                            </p>
                            <h3 className="mt-1 text-xl font-semibold tracking-tight">
                                Select who was present
                            </h3>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, roll no, or email"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 rounded-2xl pl-10"
                                />
                            </div>
                            <Badge variant="outline" className="h-11 rounded-full px-4 text-sm">
                                {presentCount} / {students.length} present
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => toggleFiltered(true)}
                            disabled={filteredStudents.length === 0}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark filtered present
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => toggleFiltered(false)}
                            disabled={filteredStudents.length === 0}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear filtered
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {filteredStudents.length} students visible in current search
                        </span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                            <TableRow className="border-border/60">
                                <TableHead className="w-14 pl-5 sm:pl-6">
                                    <Checkbox
                                        checked={allFilteredSelected}
                                        onCheckedChange={(checked) => toggleFiltered(!!checked)}
                                        aria-label="Toggle all filtered students"
                                    />
                                </TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="pr-5 text-right sm:pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-border/60">
                                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                        Loading students...
                                    </TableCell>
                                </TableRow>
                            ) : filteredStudents.length === 0 ? (
                                <TableRow className="border-border/60">
                                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                        No students matched your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isPresent = presentIds.has(student._id);

                                    return (
                                        <TableRow
                                            key={student._id}
                                            className="border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <TableCell className="pl-5 sm:pl-6">
                                                <Checkbox
                                                    checked={isPresent}
                                                    onCheckedChange={() => toggleStudent(student._id)}
                                                    aria-label={`Mark ${student.name} as present`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold",
                                                            isPresent
                                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                                : "border-border/60 bg-background/70 text-muted-foreground"
                                                        )}
                                                    >
                                                        {student.name?.charAt(0) || "S"}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {student.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {isPresent ? "Marked present" : "Currently absent"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {student.rollNo || "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {student.email || "—"}
                                            </TableCell>
                                            <TableCell className="pr-5 text-right sm:pr-6">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-full px-3 py-1",
                                                        isPresent
                                                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                            : "border-rose-500/20 bg-rose-500/10 text-rose-500"
                                                    )}
                                                >
                                                    {isPresent ? "Present" : "Absent"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button type="submit" className="rounded-full" disabled={submitting}>
                    {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {submitting
                        ? isEditing
                            ? "Updating..."
                            : "Saving..."
                        : isEditing
                          ? "Update Attendance"
                          : "Save Attendance"}
                </Button>
            </div>
        </form>
    );
}

function FormMetricCard({
    label,
    value,
    helper,
    tone,
}: {
    label: string;
    value: number;
    helper: string;
    tone: "emerald" | "rose" | "slate";
}) {
    const toneClass = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    };

    return (
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-3xl font-black tracking-[-0.04em] text-foreground">
                    {value}
                </span>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", toneClass[tone])}>
                    Live
                </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
    );
}
