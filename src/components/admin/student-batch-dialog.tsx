"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Layers3, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StudentBatchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: string | null;
    studentName: string;
    currentBatch?: "A" | "B" | null;
    onSuccess: () => void;
}

export function StudentBatchDialog({
    open,
    onOpenChange,
    studentId,
    studentName,
    currentBatch,
    onSuccess,
}: StudentBatchDialogProps) {
    const [batch, setBatch] = useState<"A" | "B">(currentBatch || "A");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            setBatch(currentBatch || "A");
            setError("");
        }
    };

    const handleSubmit = async () => {
        if (!studentId) return;

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`/api/admin/users/${studentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Student batch updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                setError(data.message || "Failed to update student batch");
            }
        } catch (submitError) {
            console.error("Error updating student batch:", submitError);
            setError("Failed to update student batch");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layers3 className="h-5 w-5 text-primary" />
                        Change Student Batch
                    </DialogTitle>
                    <DialogDescription>
                        Update the batch for <strong>{studentName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <FormField
                        label="Batch"
                        required
                        hint="Assignments published for this batch will become visible to the student."
                    >
                        <Select value={batch} onValueChange={(value) => setBatch(value as "A" | "B")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A">Batch A</SelectItem>
                                <SelectItem value="B">Batch B</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    {error && <Alert variant="destructive">{error}</Alert>}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || batch === (currentBatch || "A")}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Batch"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
