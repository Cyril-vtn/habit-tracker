import { useState, useCallback } from "react";
import { Activity, ActivityType } from "@/types/activities";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { getMinutesFromTime } from "@/utils/timeUtils";

export const useActivityManager = (selectedDate: Date) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);

  const loadActivities = useCallback(
    async (
      date: Date,
      displayTimes?: { startTime: string; endTime: string }
    ) => {
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("activities")
          .select(`*, activity_type:activity_types(*)`)
          .eq("date", formattedDate)
          .order("start_time", { ascending: true });

        if (error) throw error;

        const currentDisplayTimes = displayTimes || {
          startTime: "07:00 AM",
          endTime: "10:00 PM",
        };

        if (data) {
          const displayStartMinutes = getMinutesFromTime(
            currentDisplayTimes.startTime
          );
          const displayEndMinutes = getMinutesFromTime(
            currentDisplayTimes.endTime
          );

          const filteredActivities = data.filter((activity) => {
            const startMinutes = getMinutesFromTime(activity.start_time);
            const endMinutes = getMinutesFromTime(activity.end_time);
            return (
              startMinutes < displayEndMinutes &&
              endMinutes > displayStartMinutes
            );
          });

          setActivities(filteredActivities);
        }
      } catch (err) {
        console.error("Error loading activities:", err);
      }
    },
    []
  );

  const loadActivityTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setActivityTypes(data);
    } catch (err) {
      console.error("Error loading activity types:", err);
    }
  }, []);

  return {
    activities,
    activityTypes,
    loadActivities,
    loadActivityTypes,
  };
};
