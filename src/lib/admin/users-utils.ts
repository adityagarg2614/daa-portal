/**
 * Export users to CSV file
 * @param users - Array of user objects
 * @param filename - Name of the CSV file
 */
export function exportUsersToCSV(users: any[], filename: string) {
    // Define CSV headers
    const headers = ["Name", "Email", "Role", "Roll Number", "Created At"];

    // Convert users to CSV rows
    const rows = users.map((user) => [
        user.name || "N/A",
        user.email || "N/A",
        user.role,
        user.rollNo || "N/A",
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A",
    ]);

    // Create CSV content
    const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Get initials from a name for avatar display
 * @param name - User's full name
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
    if (!name || name.trim() === "") return "?";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get a consistent color for avatar based on name
 * @param name - User's name
 * @returns CSS color string
 */
export function getAvatarColor(name: string): string {
    const colors = [
        "bg-blue-500",
        "bg-purple-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-red-500",
        "bg-indigo-500",
        "bg-pink-500",
        "bg-teal-500",
        "bg-orange-500",
        "bg-cyan-500",
    ];

    // Simple hash to get consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Get badge variant for role
 * @param role - User role
 * @returns Badge variant
 */
export function getRoleVariant(role: string): "default" | "secondary" {
    return role === "admin" ? "default" : "secondary";
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * Format date and time for display
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
