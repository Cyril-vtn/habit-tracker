import { Plan } from "@/types/plans";
import { getMinutesFromTime, formatTimeForDisplay } from "@/utils/timeUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Trash2, CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanInput } from "@/lib/validations/plan";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRef, useEffect, useState } from "react";

interface PlanGridProps {
  timeSlots: string[];
  plans: Plan[];
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
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
  onTogglePlan: (plan: Plan) => Promise<void>;
  isPlanVisible: (plan: Plan) => boolean;
}

interface PositionedPlan extends Plan {
  column: number;
  totalColumns: number;
}

export function PlanGrid({
  timeSlots,
  plans,
  displayTimes,
  dragState,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEditPlan,
  onDeletePlan,
  onTogglePlan,
  isPlanVisible,
}: PlanGridProps) {
  const calculateOverlappingGroups = (plans: Plan[]): PositionedPlan[] => {
    const sortedPlans = [...plans].sort((a, b) => {
      const startA = getMinutesFromTime(a.start_time);
      const startB = getMinutesFromTime(b.start_time);
      return startA - startB;
    });

    const positionedPlans: PositionedPlan[] = [];
    const groups: PositionedPlan[][] = [];

    sortedPlans.forEach((plan) => {
      const planStart = getMinutesFromTime(plan.start_time);
      const planEnd = getMinutesFromTime(plan.end_time);

      let foundGroup = groups.find((group) =>
        group.some((groupPlan) => {
          const groupStart = getMinutesFromTime(groupPlan.start_time);
          const groupEnd = getMinutesFromTime(groupPlan.end_time);
          return planStart < groupEnd && planEnd > groupStart;
        })
      );

      if (!foundGroup) {
        foundGroup = [];
        groups.push(foundGroup);
      }

      const positionedPlan = {
        ...plan,
        column: foundGroup.length,
        totalColumns: 1,
      };

      foundGroup.push(positionedPlan);
      positionedPlans.push(positionedPlan);
    });

    return positionedPlans;
  };

  const getFilteredTimeSlots = () => {
    const startIndex = timeSlots.indexOf(displayTimes.startTime);
    const endIndex = timeSlots.indexOf(displayTimes.endTime);
    return timeSlots.slice(startIndex, endIndex + 1);
  };

  const positionedPlans = calculateOverlappingGroups(plans);

  const handleTogglePlan = async (plan: Plan) => {
    await onTogglePlan(plan);
  };

  return (
    <div className="relative">
      {getFilteredTimeSlots()
        .slice(0, -1)
        .map((timeSlot, index, array) => {
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
          const isLastElement = index === array.length - 1;

          return (
            <div
              key={timeSlot}
              className={cn(
                "h-10 border-t border-gray-200 cursor-pointer transition-colors hover:bg-accent/50",
                isInDragRange && "bg-accent/50",
                isLastElement && "border-b"
              )}
              onMouseDown={() => onDragStart(timeSlot)}
              onMouseEnter={() => onDragMove(timeSlot)}
              onMouseUp={onDragEnd}
            />
          );
        })}
      {positionedPlans.map((plan) => {
        if (!isPlanVisible(plan)) return null;

        const calculatePosition = () => {
          const startMinutes = getMinutesFromTime(plan.start_time);
          const endMinutes = getMinutesFromTime(plan.end_time);
          const displayStartMinutes = getMinutesFromTime(
            displayTimes.startTime
          );
          const displayEndMinutes = getMinutesFromTime(displayTimes.endTime);

          const adjustedStartMinutes = Math.max(
            startMinutes,
            displayStartMinutes
          );
          const adjustedEndMinutes = Math.min(
            endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes,
            displayEndMinutes
          );

          const relativeStart = adjustedStartMinutes - displayStartMinutes;
          const duration = adjustedEndMinutes - adjustedStartMinutes;

          return {
            top: Math.floor(relativeStart / 30) * 40,
            height: Math.ceil(duration / 30) * 40,
          };
        };

        const { top, height } = calculatePosition();

        return (
          <div
            key={plan.id}
            className={cn(
              "absolute rounded-lg p-2 overflow-hidden transition-all cursor-pointer group border border-black/5 hover:border-black/20 bg-gray-50",
              plan.is_finished && "bg-green-100"
            )}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              right: "0",
              left: `${plan.column * 80}px`,
              width: `calc(100% - ${plan.column * 80}px)`,
              zIndex: plan.column,
            }}
            onClick={() => onEditPlan(plan)}
          >
            <PlanContent
              plan={plan}
              onEdit={onEditPlan}
              onDelete={onDeletePlan}
              onTogglePlan={handleTogglePlan}
            />
          </div>
        );
      })}
    </div>
  );
}

function PlanContent({
  plan,
  onEdit,
  onDelete,
  onTogglePlan,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onTogglePlan: (plan: Plan) => void;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTextTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [plan.plan_name]);

  return (
    <div className="font-medium flex flex-col min-h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 flex-shrink-0 hover:bg-gray-200 rounded-full",
              plan.is_finished && "hover:bg-green-200"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlan(plan);
            }}
          >
            <CheckIcon
              className={cn(
                "h-4 w-4",
                plan.is_finished ? "text-green-500" : "text-muted-foreground"
              )}
            />
          </Button>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span
                ref={textRef}
                className={cn(
                  "relative truncate",
                  plan.is_finished && "line-through"
                )}
              >
                {plan.plan_name}
              </span>
            </TooltipTrigger>
            {isTextTruncated && (
              <TooltipContent side="top" align="start">
                {plan.plan_name}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-6 w-6 hover:bg-white"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(plan);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(plan.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
