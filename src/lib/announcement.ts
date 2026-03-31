/**
 * Announcement type to Tailwind color mapping
 */
export function getTypeColor(type: string): string {
    switch (type) {
        case "general":
            return "bg-blue-500";
        case "assignment":
            return "bg-green-500";
        case "event":
            return "bg-purple-500";
        case "urgent":
            return "bg-red-500";
        default:
            return "bg-gray-500";
    }
}

/**
 * Announcement type to badge variant
 */
export function getTypeVariant(type: string): "default" | "secondary" | "outline" | "success" {
    switch (type) {
        case "general":
            return "default";
        case "assignment":
            return "success";
        case "event":
            return "secondary";
        case "urgent":
            return "outline";
        default:
            return "default";
    }
}

/**
 * Announcement type display label
 */
export function getTypeLabel(type: string): string {
    switch (type) {
        case "general":
            return "General";
        case "assignment":
            return "Assignment";
        case "event":
            return "Event";
        case "urgent":
            return "Urgent";
        default:
            return "General";
    }
}

/**
 * Priority to Tailwind color mapping
 */
export function getPriorityColor(priority: string): string {
    switch (priority) {
        case "low":
            return "bg-gray-400";
        case "medium":
            return "bg-yellow-500";
        case "high":
            return "bg-orange-500";
        default:
            return "bg-gray-400";
    }
}

/**
 * Priority display label
 */
export function getPriorityLabel(priority: string): string {
    switch (priority) {
        case "low":
            return "Low";
        case "medium":
            return "Medium";
        case "high":
            return "High";
        default:
            return "Medium";
    }
}

/**
 * Check if announcement is expired
 */
export function isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

/**
 * Check if announcement should be published
 */
export function isPublished(publishAt: Date): boolean {
    return new Date(publishAt) <= new Date();
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
        // Past
        const absMins = Math.abs(diffMins);
        const absHours = Math.abs(diffHours);
        const absDays = Math.abs(diffDays);

        if (absMins < 60) {
            return `${absMins}m ago`;
        } else if (absHours < 24) {
            return `${absHours}h ago`;
        } else if (absDays < 7) {
            return `${absDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    } else {
        // Future
        if (diffMins < 60) {
            return `in ${diffMins}m`;
        } else if (diffHours < 24) {
            return `in ${diffHours}h`;
        } else if (diffDays < 7) {
            return `in ${diffDays}d`;
        } else {
            return date.toLocaleDateString();
        }
    }
}
