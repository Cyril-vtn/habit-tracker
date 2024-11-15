import { Activity, ActivityType } from "@/types/activities";
import { getMinutesFromTime, getBgColor } from "@/utils/timeUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityGridProps {
  timeSlots: string[];
  activities: Activity[];
  activityTypes: ActivityType[];
  displayTimes: {
    startTime: string;
    endTime: string;
  };
  dragState: {
    isDragging: boolean;
    dragStartSlot: string | null;
    dragEndSlot: string | null;
  };
  onDragStart: (timeSlot: string) => void;
  onDragMove: (timeSlot: string) => void;
  onDragEnd: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  calculateActivityPosition: (time: string) => number;
  isActivityVisible: (activity: Activity) => boolean;
}

export function ActivityGrid({
  timeSlots,
  activities,
  activityTypes,
  displayTimes,
  dragState,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEditActivity,
  onDeleteActivity,
  calculateActivityPosition,
  isActivityVisible,
}: ActivityGridProps) {
  const getFilteredTimeSlots = () => {
    const startIndex = timeSlots.indexOf(displayTimes.startTime);
    const endIndex = timeSlots.indexOf(displayTimes.endTime);
    return timeSlots.slice(startIndex, endIndex + 1);
  };

  return (
    <div className="grid grid-cols-[100px_1fr] gap-4">
      <div>
        {getFilteredTimeSlots().map((timeSlot) => (
          <div
            key={timeSlot}
            className="h-10 flex items-center justify-center border"
          >
            {timeSlot}
          </div>
        ))}
      </div>
      <div className="relative">
        {getFilteredTimeSlots().map((timeSlot) => {
          const startIdx = dragState.dragStartSlot
            ? timeSlots.indexOf(dragState.dragStartSlot)
            : 0;
          const endIdx = dragState.dragEndSlot
            ? timeSlots.indexOf(dragState.dragEndSlot)
            : 0;
          const isInDragRange =
            dragState.isDragging &&
            dragState.dragStartSlot &&
            dragState.dragEndSlot &&
            timeSlots.indexOf(timeSlot) >= Math.min(startIdx, endIdx) &&
            timeSlots.indexOf(timeSlot) <= Math.max(startIdx, endIdx);

          return (
            <div
              key={timeSlot}
              className={cn(
                "h-10 border-b border-gray-200 cursor-pointer transition-colors",
                isInDragRange && "bg-accent/50"
              )}
              onMouseDown={() => onDragStart(timeSlot)}
              onMouseEnter={() => onDragMove(timeSlot)}
              onMouseUp={onDragEnd}
            />
          );
        })}
        {activities.map((activity) => {
          const startMinutes = getMinutesFromTime(activity.start_time);
          const endMinutes = getMinutesFromTime(activity.end_time);
          const duration = endMinutes - startMinutes;
          const activityType = activityTypes.find(
            (type) => type.id === activity.activity_type_id
          );

          return (
            <div
              key={activity.id}
              className="absolute left-0 right-0 mx-2 rounded-lg p-2 overflow-hidden hover:bg-opacity-25 transition-all cursor-pointer group border border-black/5"
              style={{
                top: `${calculateActivityPosition(activity.start_time)}px`,
                height: `${(duration / 30) * 40}px`,
                backgroundColor: getBgColor(activityType?.color),
                display: isActivityVisible(activity) ? "block" : "none",
              }}
              onClick={() => onEditActivity(activity)}
            >
              <ActivityContent
                activity={activity}
                activityType={activityType}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityContent({
  activity,
  activityType,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  activityType?: ActivityType;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activityType && (
            <div
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: activityType.color }}
              title={activityType.name}
            />
          )}
          <span>{activity.activity_name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(activity);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(activity.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="text-sm opacity-75 flex items-center gap-2">
        <span>
          {activity.start_time} - {activity.end_time}
        </span>
        {activityType && (
          <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">
            {activityType.name}
          </span>
        )}
      </div>
      {activity.notes && (
        <div className="text-sm mt-1 opacity-75">{activity.notes}</div>
      )}
    </>
  );
}
