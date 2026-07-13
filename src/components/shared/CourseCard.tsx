import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { motion } from "framer-motion";
import { ChevronRight, FileText, Users } from "lucide-react";

/** Base course data interface */
export interface CourseCardData {
  _id: string;
  title: string;
  slug?: string;
  description?: string | null;
  status?: string;
  teacherName?: string;
  moduleCount?: number;
  enrollmentCount?: number;
}

interface CourseCardProps {
  course: CourseCardData;
  /** Where clicking the card navigates to */
  onClick: () => void;
  /** Show status badge (default: true for teacher, false for student) */
  showStatus?: boolean;
  /** Extra content below description */
  footer?: React.ReactNode;
}

/**
 * Reusable course card with hover animation.
 * Used in Dashboard, Courses list, public catalog, etc.
 *
 * @example
 * ```tsx
 * <CourseCard
 *   course={course}
 *   onClick={() => navigate(`/courses/${course.slug}`)}
 * />
 * ```
 */
export function CourseCard({ course, onClick, showStatus = true, footer }: CourseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full"
        onClick={onClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-base leading-snug line-clamp-2">
                {course.title}
              </CardTitle>
              {course.teacherName && (
                <CardDescription className="text-xs">
                  {course.teacherName}
                  {course.moduleCount !== undefined && ` · ${course.moduleCount} ta modul`}
                </CardDescription>
              )}
              {!course.teacherName && course.moduleCount !== undefined && (
                <CardDescription className="text-xs">
                  {course.moduleCount} ta modul
                </CardDescription>
              )}
            </div>
            {showStatus && course.status && (
              <StatusBadge status={course.status} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1 min-w-0">
              {course.description?.slice(0, 60) || "Tavsif yo'q"}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
          </div>

          {footer && (
            <div className="mt-3 pt-3 border-t border-border/30">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Teacher course card with stats and action buttons.
 * Extended version of CourseCard for the teacher's course list.
 */
export function TeacherCourseCard({
  course,
  onEdit,
  onTogglePublish,
  onDelete,
}: CourseCardProps & {
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <CourseCard
      course={course}
      onClick={onEdit}
      showStatus={true}
      footer={
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {course.moduleCount ?? 0} modul
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.enrollmentCount ?? 0} o'quvchi
          </span>
        </div>
      }
    />
  );
}
