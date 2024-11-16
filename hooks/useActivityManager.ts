import { useState, useCallback, useEffect } from "react";
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

        if (data) {
          setActivities(data);
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

  useEffect(() => {
    loadActivities(selectedDate);
  }, [selectedDate, loadActivities]);

  return {
    activities,
    activityTypes,
    loadActivities,
    loadActivityTypes,
  };
};
