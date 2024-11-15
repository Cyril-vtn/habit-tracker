"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Activity, ActivityType } from "@/types/activities";
import { format } from "date-fns";
import ActivityTypeManager from "./ActivityTypeManager";
import { Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HabitTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activityName, setActivityName] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [typesUpdated, setTypesUpdated] = useState(false);

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${period}`;
  });

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime("");
    setEndTime("");
    setActivityName("");
    setSelectedType("");
    setNotes("");
  };

  const addActivity = async () => {
    if (
      !selectedDate ||
      !startTime ||
      !endTime ||
      !activityName ||
      !selectedType
    ) {
      console.error("Missing required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            date: selectedDate.toISOString().split("T")[0],
            start_time: startTime,
            end_time: endTime,
            activity_name: activityName,
            activity_type_id: selectedType,
            notes: notes || null,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error("Error adding activity:", error.message);
        return;
      }

      if (data) {
        setActivities((prev) => [...prev, data]);
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error("Error in addActivity:", err);
    }
  };

  const loadActivities = async (date: Date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          activity_type:activity_types(*)
        `
        )
        .eq("date", formattedDate)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error loading activities:", error.message);
        return;
      }

      if (data) {
        setActivities(data);
      }
    } catch (err) {
      console.error("Error in loadActivities:", err);
    }
  };

  const loadActivityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error loading activity types:", error.message);
        return;
      }

      if (data) {
        setActivityTypes(data);
      }
    } catch (err) {
      console.error("Error in loadActivityTypes:", err);
    }
  };

  const updateActivity = async (updatedFields: Partial<Activity>) => {
    if (!editingActivity) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update(updatedFields)
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
    loadActivities(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadActivityTypes();
    setTypesUpdated(false);
  }, [typesUpdated]);

  useEffect(() => {
    loadActivities(selectedDate);
  }, [selectedDate, activityTypes]);

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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-8">
        <ActivityTypeManager onTypeChange={handleTypeChange} />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Activity</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activity Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue>
                        {activityTypes.find((type) => type.id === selectedType)
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
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="Activity Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue>{startTime}</SelectValue>
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
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue>{endTime}</SelectValue>
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 w-full">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-center text-xl font-semibold")}
                >
                  {format(selectedDate, "EEEE, MMMM do, yyyy")}
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

      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div>
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot}
              className="h-10 flex items-center justify-center border"
            >
              {timeSlot}
            </div>
          ))}
        </div>
        <div className="relative">
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="h-10 border-b border-gray-200" />
          ))}
          {activities.map((activity) => {
            const startMinutes = getMinutesFromTime(activity.start_time);
            const endMinutes = getMinutesFromTime(activity.end_time);
            const duration = endMinutes - startMinutes;
            const activityType = activityTypes.find(
              (type) => type.id === activity.activity_type_id
            );

            // Convertir la couleur hex en rgba avec faible opacité
            const getBgColor = (hexColor: string | undefined) => {
              if (!hexColor) return "rgb(var(--primary) / 0.05)";
              // Convertir hex en rgb et ajouter une faible opacité
              const hex = hexColor.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              return `rgba(${r}, ${g}, ${b}, 0.15)`; // Opacité à 0.15
            };

            return (
              <div
                key={activity.id}
                className="absolute left-0 right-0 mx-2 rounded-lg p-2 overflow-hidden hover:bg-opacity-25 transition-all cursor-pointer group border border-black/5"
                style={{
                  top: `${(startMinutes / 30) * 40}px`,
                  height: `${(duration / 30) * 40}px`,
                  backgroundColor: getBgColor(activityType?.color),
                }}
                onClick={() => setEditingActivity(activity)}
              >
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
                          setEditingActivity(activity);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteActivity(activity.id);
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
                  <div className="text-sm mt-1 opacity-75">
                    {activity.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={updateActivity}
          activityTypes={activityTypes}
          timeSlots={timeSlots}
        />
      )}
    </div>
  );
}

function getMinutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const EditActivityDialog = ({
  activity,
  isOpen,
  onClose,
  onSave,
  activityTypes,
  timeSlots,
}: {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedActivity: Partial<Activity>) => Promise<void>;
  activityTypes: ActivityType[];
  timeSlots: string[];
}) => {
  const [editedName, setEditedName] = useState<string>(activity.activity_name);
  const [editedStartTime, setEditedStartTime] = useState<string>(
    activity.start_time
  );
  const [editedEndTime, setEditedEndTime] = useState<string>(activity.end_time);
  const [editedNotes, setEditedNotes] = useState<string>(activity.notes || "");
  const [editedTypeId, setEditedTypeId] = useState<string>(
    activity.activity_type_id
  );

  useEffect(() => {
    if (activity) {
      setEditedName(activity.activity_name);
      setEditedStartTime(activity.start_time);
      setEditedEndTime(activity.end_time);
      setEditedNotes(activity.notes || "");
      setEditedTypeId(activity.activity_type_id);
    }
  }, [activity]);

  const handleSave = async () => {
    await onSave({
      activity_name: editedName,
      start_time: editedStartTime,
      end_time: editedEndTime,
      notes: editedNotes,
      activity_type_id: editedTypeId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
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

          <Button onClick={handleSave} className="mt-4">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
