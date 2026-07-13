import { CourseStatus } from "@/convex/schema";

interface StatusBadgeProps {
  status: string;
  /** Optional custom label overrides */
  labels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
  [CourseStatus.PUBLISHED]: "Nashr etilgan",
  [CourseStatus.DRAFT]: "Qoralama",
  [CourseStatus.ARCHIVED]: "Arxivlangan",
};

const statusStyles: Record<string, string> = {
  [CourseStatus.PUBLISHED]:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  [CourseStatus.DRAFT]:
    "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  [CourseStatus.ARCHIVED]:
    "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * Reusable status badge for courses and other entities.
 * Automatically maps status codes (draft/published/archived) to
 * localized labels with appropriate color styling.
 *
 * @example
 * ```tsx
 * <StatusBadge status={course.status} />
 * <StatusBadge status="published" labels={{ published: "Faol" }} />
 * ```
 */
export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const label = (labels || defaultLabels)[status] || status;
  const className = statusStyles[status] || "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
}
