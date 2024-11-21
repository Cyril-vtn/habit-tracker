import { Activity, ActivityType } from "@/types/activities";
import {
  getMinutesFromTime,
  getBgColor,
  formatTimeForDisplay,
} from "@/utils/timeUtils";
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
  isActivityVisible: (activity: Activity) => boolean;
}

interface PositionedActivity extends Activity {
  column: number;
  totalColumns: number;
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
  isActivityVisible,
}: ActivityGridProps) {
  const calculateOverlappingGroups = (
    activities: Activity[]
  ): PositionedActivity[] => {
    const sortedActivities = [...activities].sort((a, b) => {
      const startA = getMinutesFromTime(a.start_time);
      const startB = getMinutesFromTime(b.start_time);
      return startA - startB;
    });

    const positionedActivities: PositionedActivity[] = [];
    const groups: PositionedActivity[][] = [];

    sortedActivities.forEach((activity) => {
      const activityStart = getMinutesFromTime(activity.start_time);
      const activityEnd = getMinutesFromTime(activity.end_time);

      // Trouver le groupe qui chevauche cette activité
      let foundGroup = groups.find((group) =>
        group.some((groupActivity) => {
          const groupStart = getMinutesFromTime(groupActivity.start_time);
          const groupEnd = getMinutesFromTime(groupActivity.end_time);
          return activityStart < groupEnd && activityEnd > groupStart;
        })
      );

      if (!foundGroup) {
        foundGroup = [];
        groups.push(foundGroup);
      }

      const positionedActivity = {
        ...activity,
        column: foundGroup.length,
        totalColumns: 1,
      };

      foundGroup.push(positionedActivity);
      positionedActivities.push(positionedActivity);
    });

    return positionedActivities;
  };

  const getFilteredTimeSlots = () => {
    const startIndex = timeSlots.indexOf(displayTimes.startTime);
    const endIndex = timeSlots.indexOf(displayTimes.endTime);
    const slots = timeSlots.slice(startIndex, endIndex + 1);
    if (displayTimes.endTime === timeSlots[timeSlots.length - 2]) {
      slots.push("11:59 PM");
    }
    return slots;
  };

  const positionedActivities = calculateOverlappingGroups(activities);

  return (
    <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-2 sm:gap-4">
      <div className="pt-3">
        {getFilteredTimeSlots().map((timeSlot) => (
          <div
            key={timeSlot}
            className="h-10 flex items-start justify-end pr-2 text-xs sm:text-sm"
            style={{
              transform: "translateY(-12px)",
            }}
          >
            {timeSlot}
          </div>
        ))}
      </div>
      <div className="relative pt-3">
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
                "h-10 border-t border-gray-200 cursor-pointer transition-colors hover:bg-accent/50",
                isInDragRange && "bg-accent/50"
              )}
              onMouseDown={() => onDragStart(timeSlot)}
              onMouseEnter={() => onDragMove(timeSlot)}
              onMouseUp={onDragEnd}
            />
          );
        })}
        {positionedActivities.map((activity) => {
          if (!isActivityVisible(activity)) return null;

          const calculateAdjustedPosition = (activity: PositionedActivity) => {
            const startMinutes = getMinutesFromTime(activity.start_time);
            const endMinutes = getMinutesFromTime(activity.end_time);
            const displayStartMinutes = getMinutesFromTime(
              displayTimes.startTime
            );
            const displayEndMinutes = getMinutesFromTime(displayTimes.endTime);

            // Ajuster le début et la fin pour rester dans les limites d'affichage
            const adjustedStartMinutes = Math.max(
              startMinutes,
              displayStartMinutes
            );
            let adjustedEndMinutes = Math.min(
              endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes,
              displayEndMinutes
            );

            if (endMinutes === getMinutesFromTime("11:59 PM")) {
              adjustedEndMinutes = displayEndMinutes + 30;
            }

            // Calculer la position relative au début de l'affichage
            const relativeStart = adjustedStartMinutes - displayStartMinutes;
            const duration = adjustedEndMinutes - adjustedStartMinutes;

            return {
              top: Math.floor(relativeStart / 30) * 40 + 12,
              height: Math.ceil(duration / 30) * 40,
            };
          };

          const { top, height } = calculateAdjustedPosition(activity);

          const activityType = activityTypes.find(
            (type) => type.id === activity.activity_type_id
          );

          return (
            <div
              key={activity.id}
              className="absolute rounded-lg p-2 overflow-hidden transition-all cursor-pointer group border border-black/5 hover:border-black/20"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: getBgColor(activityType?.color),
                right: "0",
                left: `${activity.column * 80}px`,
                width: `calc(100% - ${activity.column * 80}px)`,
                zIndex: activity.column,
              }}
              onClick={() => onEditActivity(activity)}
            >
              <ActivityContent
                activity={{
                  ...activity,
                  start_time: formatTimeForDisplay(activity.start_time),
                  end_time: formatTimeForDisplay(activity.end_time),
                }}
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
