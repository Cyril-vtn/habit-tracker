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
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Activity, ActivityType } from "@/types/activities";
import { formatTimeForDisplay, getMinutesFromTime } from "@/utils/timeUtils";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityGrid } from "./ActivityGrid";
import ActivityTypeManager from "./ActivityTypeManager";
import { DisplayTimeSelector } from "./DisplayTimeSelector";

const LOCAL_STORAGE_KEY = "habitTracker_displayTimes";

export default function HabitTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const timeSlots = useTimeSlots();
  const { activities, activityTypes, loadActivities, loadActivityTypes } =
    useActivityManager(selectedDate);

  const [formState, setFormState] = useState({
    startTime: "",
    endTime: "",
    activityName: "",
    notes: "",
    selectedType: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [typesUpdated, setTypesUpdated] = useState(false);

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

  const resetForm = () => {
    setSelectedDate(new Date());
    setFormState({
      startTime: "",
      endTime: "",
      activityName: "",
      notes: "",
      selectedType: "",
    });
  };

  const addActivity = async () => {
    if (
      !selectedDate ||
      !formState.startTime ||
      !formState.endTime ||
      !formState.activityName ||
      !formState.selectedType
    ) {
      console.error("Missing required fields");
      return;
    }

    try {
      const date = selectedDate.toISOString().split("T")[0];
      const [startHours, startMinutes] = formState.startTime
        .split(" ")[0]
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = formState.endTime
        .split(" ")[0]
        .split(":")
        .map(Number);

      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startHours, startMinutes, 0);

      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endHours, endMinutes, 0);

      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            date: date,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            activity_name: formState.activityName,
            activity_type_id: formState.selectedType,
            notes: formState.notes || null,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        await loadActivities(selectedDate);
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error("Error in addActivity:", err);
    }
  };

  const updateActivity = async (updatedFields: Partial<Activity>) => {
    if (!editingActivity) return;

    try {
      const fieldsToUpdate = {
        activity_name: updatedFields.activity_name,
        activity_type_id: updatedFields.activity_type_id,
        notes: updatedFields.notes,
        start_time: updatedFields.start_time,
        end_time: updatedFields.end_time,
      };

      const { error } = await supabase
        .from("activities")
        .update(fieldsToUpdate)
        .eq("id", editingActivity.id);

      if (error) throw error;
      loadActivities(selectedDate);
      setEditingActivity(null);
    } catch (err) {
      console.error("Error updating activity:", err);
    }
  };

  const deleteActivity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);

      if (error) throw error;
      loadActivities(selectedDate);
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  useEffect(() => {
    loadActivities(selectedDate, displayTimes);
  }, [selectedDate, displayTimes, loadActivities]);

  useEffect(() => {
    loadActivityTypes();
    setTypesUpdated(false);
  }, [typesUpdated, loadActivityTypes]);

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

  const handleTypeChange = () => {
    setTypesUpdated(true);
  };

  const handleDragStart = (timeSlot: string) => {
    setDragState({
      ...dragState,
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
      const startIdx = dragState.dragStartSlot
        ? timeSlots.indexOf(dragState.dragStartSlot)
        : 0;
      const endIdx = dragState.dragEndSlot
        ? timeSlots.indexOf(dragState.dragEndSlot)
        : 0;
      const finalStartTime = timeSlots[Math.min(startIdx, endIdx)];
      const finalEndTime = timeSlots[Math.max(startIdx, endIdx)];

      setFormState({
        ...formState,
        startTime: finalStartTime,
        endTime: finalEndTime,
      });
      setIsDialogOpen(true);
    }

    setDragState({
      ...dragState,
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
    loadActivities(selectedDate, newDisplayTimes);
  };

  useEffect(() => {
    const savedTimes = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTimes) {
      const parsedTimes = JSON.parse(savedTimes);
      setDisplayTimes(parsedTimes);
      loadActivities(selectedDate, parsedTimes);
    }
  }, []);

  return (
    <div className="p-4">
      <div className="space-y-4 sm:space-y-8">
        <div className="flex flex-row items-start sm:items-center justify-between gap-4">
          <ActivityTypeManager onTypeChange={handleTypeChange} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Activity</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new activity to your schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Activity Type</label>
                    <Select
                      value={formState.selectedType}
                      onValueChange={(type) =>
                        setFormState({ ...formState, selectedType: type })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {activityTypes.find(
                            (type) => type.id === formState.selectedType
                          )?.name || "Select a type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Activity Name</label>
                    <Input
                      value={formState.activityName}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          activityName: e.target.value,
                        })
                      }
                      placeholder="Activity Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Time</label>
                      <Select
                        value={formState.startTime}
                        onValueChange={(time) =>
                          setFormState({ ...formState, startTime: time })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue>{formState.startTime}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Time</label>
                      <Select
                        value={formState.endTime}
                        onValueChange={(time) =>
                          setFormState({ ...formState, endTime: time })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue>{formState.endTime}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={formState.notes}
                      onChange={(e) =>
                        setFormState({ ...formState, notes: e.target.value })
                      }
                      placeholder="Notes (optional)"
                    />
                  </div>
                </div>

                <Button onClick={addActivity} className="mt-4">
                  Add Activity
                </Button>
              </div>
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
      </div>

      <DisplayTimeSelector
        timeSlots={timeSlots}
        displayTimes={displayTimes}
        onTimeChange={handleDisplayTimeChange}
      />

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

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={updateActivity}
          activityTypes={activityTypes}
          timeSlots={timeSlots}
          onDeleteActivity={deleteActivity}
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
  onSave: (updatedActivity: Partial<Activity>) => Promise<void>;
  activityTypes: ActivityType[];
  timeSlots: string[];
  onDeleteActivity: (id: string) => void;
}) => {
  const [editedName, setEditedName] = useState<string>(activity.activity_name);
  const [editedStartTime, setEditedStartTime] = useState<string>("");
  const [editedEndTime, setEditedEndTime] = useState<string>("");
  const [editedNotes, setEditedNotes] = useState<string>(activity.notes || "");
  const [editedTypeId, setEditedTypeId] = useState<string>(
    activity.activity_type_id
  );

  // Initialisation avec conversion en format 12h
  useEffect(() => {
    if (activity) {
      setEditedName(activity.activity_name);
      setEditedStartTime(formatTimeForDisplay(activity.start_time));
      setEditedEndTime(formatTimeForDisplay(activity.end_time));
      setEditedNotes(activity.notes || "");
      setEditedTypeId(activity.activity_type_id);
    }
  }, [activity]);

  const handleSave = async () => {
    try {
      // Créer une date de base à partir de la date de l'activité
      const baseDate = new Date(activity.date);

      // Traiter l'heure de début
      const [startTime, startPeriod] = editedStartTime.split(" ");
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      let startHours24 = startHours;
      if (startPeriod === "PM" && startHours !== 12) {
        startHours24 = startHours + 12;
      } else if (startPeriod === "AM" && startHours === 12) {
        startHours24 = 0;
      }

      // Traiter l'heure de fin
      const [endTime, endPeriod] = editedEndTime.split(" ");
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      let endHours24 = endHours;
      if (endPeriod === "PM" && endHours !== 12) {
        endHours24 = endHours + 12;
      } else if (endPeriod === "AM" && endHours === 12) {
        endHours24 = 0;
      }

      // Créer les dates finales
      const startDateTime = new Date(baseDate);
      startDateTime.setHours(startHours24, startMinutes, 0, 0);

      const endDateTime = new Date(baseDate);
      endDateTime.setHours(endHours24, endMinutes, 0, 0);

      await onSave({
        activity_name: editedName,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: editedNotes,
        activity_type_id: editedTypeId,
      });

      onClose();
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Modify the activity details and save your changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Select value={editedTypeId} onValueChange={setEditedTypeId}>
                <SelectTrigger>
                  <SelectValue>
                    {activityTypes.find((type) => type.id === editedTypeId)
                      ?.name || "Select a type"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Name</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Activity Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Select
                  value={editedStartTime}
                  onValueChange={setEditedStartTime}
                >
                  <SelectTrigger>
                    <SelectValue>{editedStartTime}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Select value={editedEndTime} onValueChange={setEditedEndTime}>
                  <SelectTrigger>
                    <SelectValue>{editedEndTime}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Notes (optional)"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteActivity(activity.id);
                onClose();
              }}
            >
              Delete Activity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
