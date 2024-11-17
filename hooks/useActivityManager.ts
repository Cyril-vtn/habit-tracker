import { useState, useCallback, useEffect } from "react";
import { Activity, ActivityType } from "@/types/activities";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { getMinutesFromTime } from "@/utils/timeUtils";

export const useActivityManager = (selectedDate: Date) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const loadActivities = useCallback(
    async (
      date: Date,
      displayTimes?: { startTime: string; endTime: string }
    ) => {
      setIsLoading(true);
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          console.log("No user found");
          return;
        }

        let query = supabase
          .from("activities")
          .select(`*, activity_type:activity_types(*)`)
          .eq("date", formattedDate)
          .eq("user_id", userData.user.id);

        if (displayTimes) {
          const displayStartMinutes = getMinutesFromTime(
            displayTimes.startTime
          );
          const displayEndMinutes = getMinutesFromTime(displayTimes.endTime);

          const startTimeISO = new Date(date);
          startTimeISO.setHours(Math.floor(displayStartMinutes / 60));
          startTimeISO.setMinutes(displayStartMinutes % 60);

          const endTimeISO = new Date(date);
          endTimeISO.setHours(Math.floor(displayEndMinutes / 60));
          endTimeISO.setMinutes(displayEndMinutes % 60);

          query = query.or(
            `and(start_time.lte."${endTimeISO.toISOString()}",end_time.gte."${startTimeISO.toISOString()}")`
          );
        }

        const { data, error } = await query.order("start_time", {
          ascending: true,
        });

        if (error) throw error;
        if (data) {
          setActivities(data);
        }
      } catch (err) {
        console.error("Error loading activities:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadActivityTypes = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("name");

      if (error) throw error;
      if (data) setActivityTypes(data);
    } catch (err) {
      console.error("Error loading activity types:", err);
    }
  }, []);

  useEffect(() => {
    loadActivityTypes();
  }, [loadActivityTypes]);

  useEffect(() => {
    const loadData = async () => {
      await loadActivityTypes();
      await loadActivities(selectedDate);
    };
    loadData();
  }, [selectedDate]);

  return {
    activities,
    activityTypes,
    loadActivities,
    loadActivityTypes,
    isLoading,
  };
};
