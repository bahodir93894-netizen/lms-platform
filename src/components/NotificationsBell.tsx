import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck, GraduationCap, MessageSquare, Trophy, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";

const typeIcons: Record<string, React.ElementType> = {
  enroll: UserPlus,
  grade: Trophy,
  certificate: GraduationCap,
  feedback: MessageSquare,
};

const typeColors: Record<string, string> = {
  enroll: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  grade: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  certificate: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  feedback: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

export default function NotificationsBell() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.list, { limit: 10 });
  const unreadCount = useQuery(api.notifications.unreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const handleClick = async (notification: any) => {
    await markRead({ notificationId: notification._id as Id<"notifications"> });
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const count = unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirishnomalar</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-3 w-3" />
              Hammasini o'qish
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Bildirishnomalar yo'q
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || MessageSquare;
              const color = typeColors[n.type] || "bg-muted text-muted-foreground";
              return (
                <DropdownMenuItem
                  key={n._id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer ${
                    !n.read ? "bg-muted/30" : ""
                  }`}
                  onSelect={() => handleClick(n)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
