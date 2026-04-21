"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Search, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Student {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
}

interface AttendanceFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function AttendanceForm({ onSuccess, onCancel }: AttendanceFormProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Form fields
    const [title, setTitle] = useState(`Class - ${new Date().toLocaleDateString()}`);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [presentIds, setPresentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch("/api/admin/students?limit=1000"); // Fetch all students
                const data = await res.json();
                if (data.success) {
                    setStudents(data.data.students);
                }
            } catch (error) {
                toast.error("Failed to load students");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setPresentIds(new Set(students.map(s => s._id)));
        } else {
            setPresentIds(new Set());
        }
    };

    const toggleStudent = (id: string) => {
        const newSet = new Set(presentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setPresentIds(newSet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            const records = students.map(s => ({
                userId: s._id,
                present: presentIds.has(s._id)
            }));

            const res = await fetch("/api/admin/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, date, records, type: "class" })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Attendance recorded successfully");
                onSuccess();
            } else {
                toast.error(data.message || "Failed to save attendance");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.rollNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. DAA Lecture #12"
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
                        required
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base">Mark Students</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or roll no..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <Badge variant="outline" className="h-9 px-3">
                            {presentIds.size} / {students.length} Present
                        </Badge>
                    </div>
                </div>

                <div className="border rounded-md max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox 
                                        checked={presentIds.size === students.length && students.length > 0}
                                        onCheckedChange={(checked) => toggleAll(!!checked)}
                                    />
                                </TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Loading students...</TableCell>
                                </TableRow>
                            ) : filteredStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No students found</TableCell>
                                </TableRow>
                            ) : (
                                filteredStudents.map((student) => (
                                    <TableRow key={student._id}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={presentIds.has(student._id)}
                                                onCheckedChange={() => toggleStudent(student._id)}
                                            />
                                        </TableCell>
                                        <TableCell>{student.rollNo}</TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>
                                            {presentIds.has(student._id) ? (
                                                <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100">Present</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Absent</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? "Saving..." : "Save Attendance"}
                </Button>
            </div>
        </form>
    );
}
