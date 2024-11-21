"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { activitySchema, type ActivityInput } from "@/lib/validations/activity";
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
import { TimelineView } from "./TimelineView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOCAL_STORAGE_KEY = "habitTracker_displayTimes";

export default function HabitTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const timeSlots = useTimeSlots();
  const {
    activities,
    activityTypes,
    isLoading,
    addActivity,
    updateActivity,
    deleteActivity,
    setActivityTypes,
  } = useActivityManager(selectedDate);
  const [formState, setFormState] = useState({
    startTime: "",
    endTime: "",
    activityName: "",
    notes: "",
    selectedType: "",
  });
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

  const resetForm = () => {
    setFormState({
      startTime: "",
      endTime: "",
      activityName: "",
      notes: "",
      selectedType: "",
    });
  };

  const form = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity_name: "",
      activity_type_id: "",
      start_time: "",
      end_time: "",
      notes: "",
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

  const handleDragStart = (timeSlot: string) => {
    console.log("DragStart:", timeSlot);
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
    if (
      dragState.isDragging &&
      dragState.dragStartSlot &&
      dragState.dragEndSlot
    ) {
      const startIdx = timeSlots.indexOf(dragState.dragStartSlot);
      const endIdx = timeSlots.indexOf(dragState.dragEndSlot);
      const finalStartTime = timeSlots[Math.min(startIdx, endIdx)];
      const finalEndTime = timeSlots[Math.max(startIdx, endIdx + 1)];

      form.setValue("start_time", finalStartTime);
      form.setValue("end_time", finalEndTime);
      setIsDialogOpen(true);
    } else if (dragState.dragStartSlot) {
      const startIdx = timeSlots.indexOf(dragState.dragStartSlot);
      const endIdx = startIdx + 1;

      form.setValue("start_time", timeSlots[startIdx]);
      form.setValue("end_time", timeSlots[endIdx]);
      setIsDialogOpen(true);
    }

    setDragState({
      isDragging: false,
      dragStartSlot: null,
      dragEndSlot: null,
    });
  };

  const calculateActivityPosition = (time: string) => {
    const startMinutes = getMinutesFromTime(time);
    const displayStartMinutes = getMinutesFromTime(displayTimes.startTime);
    return ((startMinutes - displayStartMinutes) / 30) * 40;
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

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="day" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList>
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="day" className="flex-1 flex flex-col">
          {isLoading && (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <div className="flex-none px-4 pt-2 pb-2 space-y-2">
            <div className="flex flex-row items-start sm:items-center justify-between gap-4">
              <ActivityTypeManager
                activityTypes={activityTypes}
                onActivityTypesChange={handleActivityTypesChange}
              />
              <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button>Add Activity</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Activity</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new activity to your
                      schedule.
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
                            <FormLabel>Activity Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Activity Type</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
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
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Start time" />
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
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="End time" />
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
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Add Activity</Button>
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
                        ? format(selectedDate, "dd/MM/yyyy")
                        : format(selectedDate, "EEEE, MMMM do, yyyy")}
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

          <div
            className="flex-1 overflow-auto px-4 h-screen"
            style={{ height: `calc(100vh - 180px)` }}
          >
            <ActivityGrid
              timeSlots={timeSlots}
              activities={activities}
              activityTypes={activityTypes}
              displayTimes={displayTimes}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onEditActivity={setEditingActivity}
              onDeleteActivity={deleteActivity}
              calculateActivityPosition={calculateActivityPosition}
              isActivityVisible={isActivityVisible}
            />
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
        </TabsContent>

        <TabsContent value="timeline" className="flex-1">
          <TimelineView initialDate={selectedDate} />
        </TabsContent>
      </Tabs>
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
  const form = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
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
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="activity_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Activity Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
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
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
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
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                      Save Changes
                    </Button>
                  </div>
                </TooltipTrigger>
                {!hasChanges && (
                  <TooltipContent>
                    <p>No change has been made to this activity</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Button
                variant="destructive"
                onClick={() => onDeleteActivity(activity.id)}
              >
                Delete Activity
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
