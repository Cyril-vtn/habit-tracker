"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActivityManager } from "@/hooks/useActivityManager";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { Activity, ActivityType } from "@/types/activities";
import {
  convertToUTC,
  formatTimeForDisplay,
  getMinutesFromTime,
} from "@/utils/timeUtils";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityGrid } from "./ActivityGrid";
import ActivityTypeManager from "./ActivityTypeManager";
import { DisplayTimeSelector } from "./DisplayTimeSelector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlanManager } from "@/hooks/usePlanManager";
import { Plan } from "@/types/plans";
import { PlanGrid } from "./PlanGrid";
import { createPlanSchema, type PlanInput } from "@/lib/validations/plan";
import { Checkbox } from "./ui/checkbox";
import { useLanguage } from "@/hooks/useLanguage";
import { ActivityInput } from "@/lib/validations/activity";
import { createActivitySchema } from "@/lib/validations/activity";

const LOCAL_STORAGE_KEY = "habitTracker_displayTimes";

export default function HabitTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const timeSlots = useTimeSlots();
  const { t } = useLanguage();
  const {
    activities,
    activityTypes,
    isLoading,
    addActivity,
    updateActivity,
    deleteActivity,
    setActivityTypes,
  } = useActivityManager(selectedDate);
  const {
    plans,
    isLoading: isLoadingPlans,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlan,
  } = usePlanManager(selectedDate);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragStartSlot: null as string | null,
    dragEndSlot: null as string | null,
  });
  const [displayTimes, setDisplayTimes] = useState({
    startTime: "07:00 AM",
    endTime: "10:00 PM",
  });
  const [windowWidth, setWindowWidth] = useState(0);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<"plan" | "activity" | null>(
    null
  );

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTimes = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTimes) {
      const parsedTimes = JSON.parse(savedTimes);
      setDisplayTimes(parsedTimes);
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        handleDragEnd();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragState.isDragging]);

  const form = useForm<ActivityInput>({
    resolver: zodResolver(createActivitySchema(t)),
    defaultValues: {
      activity_name: "",
      activity_type_id: "",
      start_time: "",
      end_time: "",
      notes: "",
    },
  });

  const planForm = useForm<PlanInput>({
    resolver: zodResolver(createPlanSchema(t)),
    defaultValues: {
      plan_name: "",
      start_time: "",
      end_time: "",
    },
  });

  const handleAddActivity = async (data: ActivityInput) => {
    try {
      const startDateTime = convertToUTC(selectedDate, data.start_time);
      const endDateTime = convertToUTC(selectedDate, data.end_time);

      await addActivity({
        activityName: data.activity_name,
        activityTypeId: data.activity_type_id,
        startTime: formatTimeForDisplay(startDateTime.toISOString()),
        endTime: formatTimeForDisplay(endDateTime.toISOString()),
        notes: data.notes,
      });

      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleDragStart = (timeSlot: string, column: "plan" | "activity") => {
    setActiveColumn(column);
    setDragState({
      isDragging: true,
      dragStartSlot: timeSlot,
      dragEndSlot: timeSlot,
    });
  };

  const handleDragMove = (timeSlot: string) => {
    if (dragState.isDragging) {
      setDragState({
        ...dragState,
        dragEndSlot: timeSlot,
      });
    }
  };

  const handleDragEnd = () => {
    if (!dragState.dragStartSlot || !dragState.dragEndSlot || !activeColumn)
      return;

    const endSlotIndex = timeSlots.indexOf(dragState.dragEndSlot);
    const endTime = timeSlots[endSlotIndex + 1] || dragState.dragEndSlot;

    if (activeColumn === "plan") {
      setIsPlanDialogOpen(true);
      planForm.setValue("start_time", dragState.dragStartSlot);
      planForm.setValue("end_time", endTime);
    } else {
      setIsDialogOpen(true);
      form.setValue("start_time", dragState.dragStartSlot);
      form.setValue("end_time", endTime);
    }

    setDragState({
      isDragging: false,
      dragStartSlot: null,
      dragEndSlot: null,
    });
    setActiveColumn(null);
  };

  const isActivityVisible = (activity: Activity) => {
    const startMinutes = getMinutesFromTime(activity.start_time);
    const endMinutes = getMinutesFromTime(activity.end_time);
    const displayStartMinutes = getMinutesFromTime(displayTimes.startTime);
    const displayEndMinutes = getMinutesFromTime(displayTimes.endTime);

    return startMinutes < displayEndMinutes && endMinutes > displayStartMinutes;
  };

  const handleDisplayTimeChange = (type: "start" | "end", time: string) => {
    const newDisplayTimes = {
      ...displayTimes,
      [type === "start" ? "startTime" : "endTime"]: time,
    };
    setDisplayTimes(newDisplayTimes);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDisplayTimes));
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({
        activity_name: "",
        activity_type_id: "",
        start_time: "",
        end_time: "",
        notes: "",
      });
    }
  };

  const handleActivityTypesChange = (newTypes: ActivityType[]) => {
    setActivityTypes(newTypes);
  };

  const isPlanVisible = (plan: Plan) => {
    const startMinutes = getMinutesFromTime(plan.start_time);
    const endMinutes = getMinutesFromTime(plan.end_time);
    const displayStartMinutes = getMinutesFromTime(displayTimes.startTime);
    const displayEndMinutes = getMinutesFromTime(displayTimes.endTime);

    return startMinutes < displayEndMinutes && endMinutes > displayStartMinutes;
  };

  const getFilteredTimeSlots = () => {
    const startIndex = timeSlots.indexOf(displayTimes.startTime);
    const endIndex = timeSlots.indexOf(displayTimes.endTime);
    return timeSlots.slice(startIndex, endIndex + 1);
  };

  const handleAddPlan = async (data: PlanInput) => {
    try {
      const startDateTime = convertToUTC(selectedDate, data.start_time);
      const endDateTime = convertToUTC(selectedDate, data.end_time);

      await addPlan({
        plan_name: data.plan_name,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_finished: data.is_finished,
      });

      planForm.reset();
      setIsPlanDialogOpen(false);
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const handlePlanDialogChange = (open: boolean) => {
    setIsPlanDialogOpen(open);
    if (!open) {
      planForm.reset({
        plan_name: "",
        start_time: "",
        end_time: "",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className="flex-none px-4 pt-2 pb-2 space-y-2">
        <div className="flex flex-row sm:items-center gap-4 w-full justify-end">
          <ActivityTypeManager
            activityTypes={activityTypes}
            onActivityTypesChange={handleActivityTypesChange}
          />
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("activities.title")}</DialogTitle>
                <DialogDescription>
                  {t("activities.addActivity")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddActivity)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="activity_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("activities.activityName")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("activities.activityName")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="activity_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("activities.activityType")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("common.selectType")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {activityTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.startTime")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("common.selectStartTime")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.endTime")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("common.selectEndTime")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.notes")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("common.notes")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">{t("common.addActivity")}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isPlanDialogOpen} onOpenChange={handlePlanDialogChange}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("common.addPlan")}</DialogTitle>
                <DialogDescription>
                  {t("common.addPlanDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...planForm}>
                <form
                  onSubmit={planForm.handleSubmit(handleAddPlan)}
                  className="space-y-4"
                >
                  <FormField
                    control={planForm.control}
                    name="plan_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("plans.planName")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("plans.planName")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={planForm.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.startTime")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("common.selectStartTime")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={planForm.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.endTime")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("common.selectEndTime")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit">{t("common.addPlan")}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-row items-center gap-4 w-full">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-base sm:text-xl font-semibold"
                >
                  {windowWidth < 640
                    ? format(selectedDate, t("calendar.dateFormat.short"))
                    : format(selectedDate, t("calendar.dateFormat.long"))}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <DisplayTimeSelector
          timeSlots={timeSlots}
          displayTimes={displayTimes}
          onTimeChange={handleDisplayTimeChange}
        />
      </div>

      <div className="flex-1 overflow-auto px-4">
        <div className="grid grid-cols-[100px_1fr_1fr] gap-2">
          <div className="h-10 sticky top-0 z-10 bg-background"></div>
          <div className="h-10 flex justify-between items-center px-2 sticky top-0 z-10 bg-background">
            <div className="text-sm font-medium">{t("common.plans")}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlanDialogOpen(true)}
            >
              <span className="hidden sm:inline">{t("common.addPlan")}</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
          <div className="h-10 flex justify-between items-center px-2 sticky top-0 z-10 bg-background">
            <div className="text-sm font-medium">{t("common.activities")}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <span className="hidden sm:inline">
                {t("common.addActivity")}
              </span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
          <div className="pt-3">
            {getFilteredTimeSlots().map((timeSlot) => (
              <div
                key={timeSlot}
                className="h-10 flex items-start justify-end pr-2 text-xs sm:text-sm"
                style={{ transform: "translateY(-12px)" }}
              >
                {timeSlot}
              </div>
            ))}
          </div>
          <div className="relative pt-3 border-r">
            <PlanGrid
              timeSlots={timeSlots}
              plans={plans}
              displayTimes={displayTimes}
              dragState={dragState}
              onDragStart={(timeSlot) => handleDragStart(timeSlot, "plan")}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onEditPlan={setEditingPlan}
              onDeletePlan={deletePlan}
              isPlanVisible={isPlanVisible}
              onTogglePlan={togglePlan}
            />
          </div>
          <div className="relative pt-3">
            <ActivityGrid
              timeSlots={timeSlots}
              activities={activities}
              activityTypes={activityTypes}
              displayTimes={displayTimes}
              dragState={dragState}
              onDragStart={(timeSlot) => handleDragStart(timeSlot, "activity")}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onEditActivity={setEditingActivity}
              onDeleteActivity={deleteActivity}
              isActivityVisible={isActivityVisible}
            />
          </div>
        </div>
      </div>

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={(updatedFields) =>
            updateActivity(editingActivity.id, updatedFields)
          }
          activityTypes={activityTypes}
          timeSlots={timeSlots}
          onDeleteActivity={deleteActivity}
        />
      )}

      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={(updatedFields: PlanInput) =>
            updatePlan(editingPlan.id, updatedFields)
          }
          timeSlots={timeSlots}
          onDeletePlan={deletePlan}
        />
      )}
    </div>
  );
}

const EditActivityDialog = ({
  activity,
  isOpen,
  onClose,
  onSave,
  activityTypes,
  timeSlots,
  onDeleteActivity,
}: {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<Activity>) => Promise<void>;
  activityTypes: ActivityType[];
  timeSlots: string[];
  onDeleteActivity: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const form = useForm<ActivityInput>({
    resolver: zodResolver(createActivitySchema(t)),
  });

  const formValues = form.watch();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (activity) {
      form.reset({
        activity_name: activity.activity_name,
        start_time: formatTimeForDisplay(activity.start_time),
        end_time: formatTimeForDisplay(activity.end_time),
        activity_type_id: activity.activity_type_id,
        notes: activity.notes || "",
      });
    }
  }, [activity, form]);

  useEffect(() => {
    const originalValues = {
      activity_name: activity.activity_name,
      start_time: formatTimeForDisplay(activity.start_time),
      end_time: formatTimeForDisplay(activity.end_time),
      activity_type_id: activity.activity_type_id,
      notes: activity.notes || "",
    };

    const hasFormChanges = Object.keys(originalValues).some(
      (key) =>
        formValues[key as keyof ActivityInput] !==
        originalValues[key as keyof ActivityInput]
    );

    setHasChanges(hasFormChanges);
  }, [formValues, activity]);

  const handleSave = async (data: ActivityInput) => {
    try {
      const baseDate = new Date(activity.date);
      const startDateTime = convertToUTC(baseDate, data.start_time);
      const endDateTime = convertToUTC(baseDate, data.end_time);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error("Invalid date conversion");
        return;
      }

      await onSave({
        activity_name: data.activity_name,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: data.notes,
        activity_type_id: data.activity_type_id,
      });
      onClose();
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("activities.title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="activity_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("activities.activityName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("activities.activityName")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activity_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("activities.activityType")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("activities.selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.startTime")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.selectStartTime")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.endTime")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.selectEndTime")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t("common.notes")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-4 flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="submit"
                      disabled={!hasChanges}
                      className="w-full"
                    >
                      {t("common.save")}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!hasChanges && (
                  <TooltipContent>
                    <p>{t("common.noChanges")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Button
                variant="destructive"
                onClick={() => onDeleteActivity(activity.id)}
              >
                {t("activities.deleteActivity")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const EditPlanDialog = ({
  plan,
  isOpen,
  onClose,
  onSave,
  timeSlots,
  onDeletePlan,
}: {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: PlanInput) => Promise<void>;
  timeSlots: string[];
  onDeletePlan: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const form = useForm<PlanInput>({
    resolver: zodResolver(createPlanSchema(t)),
    defaultValues: {
      plan_name: plan.plan_name,
      start_time: formatTimeForDisplay(plan.start_time),
      end_time: formatTimeForDisplay(plan.end_time),
      is_finished: plan.is_finished,
    },
  });

  const formValues = form.watch();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const originalValues = {
      plan_name: plan.plan_name,
      start_time: formatTimeForDisplay(plan.start_time),
      end_time: formatTimeForDisplay(plan.end_time),
      is_finished: plan.is_finished,
    };

    const hasFormChanges = Object.keys(originalValues).some(
      (key) =>
        formValues[key as keyof PlanInput] !==
        originalValues[key as keyof typeof originalValues]
    );

    setHasChanges(hasFormChanges);
  }, [formValues, plan]);

  const handleSave = async (data: PlanInput) => {
    try {
      const baseDate = new Date(plan.date);
      const startDateTime = convertToUTC(baseDate, data.start_time);
      const endDateTime = convertToUTC(baseDate, data.end_time);

      await onSave({
        plan_name: data.plan_name,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_finished: data.is_finished,
      });
      onClose();
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("plans.title")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="plan_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("plans.planName")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("plans.planName")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.startTime")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.selectStartTime")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.endTime")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.selectEndTime")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_finished"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-medium">
                      {t("plans.markAsCompleted")}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={!hasChanges}>
                {t("plans.saveChanges")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => onDeletePlan(plan.id)}
              >
                {t("plans.deletePlan")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
