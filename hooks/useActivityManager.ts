import { useState, useCallback, useEffect, useRef } from "react";
import { Activity, ActivityType } from "@/types/activities";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { convertToUTC, getMinutesFromTime } from "@/utils/timeUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./use-toast";

const supabase = createClientComponentClient();

export const useActivityManager = (selectedDate: Date) => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [hasLoadedTypes, setHasLoadedTypes] = useState(false);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!user || isLoadingRef.current) return;
    setIsLoading(true);
    isLoadingRef.current = true;

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      if (!hasLoadedTypes) {
        const typesResponse = await supabase
          .from("activity_types")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (typesResponse.data) {
          setActivityTypes(typesResponse.data);
          setHasLoadedTypes(true);
        }
      }

      const activitiesResponse = await supabase
        .from("activities")
        .select(`*, activity_type:activity_types(*)`)
        .eq("date", formattedDate)
        .eq("user_id", user.id);

      if (activitiesResponse.data) {
        setActivities(activitiesResponse.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load activities",
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [user, selectedDate, hasLoadedTypes]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, user]);

  const addActivity = async (activityData: {
    startTime: string;
    endTime: string;
    activityName: string;
    activityTypeId: string;
    notes?: string;
  }) => {
    if (!user) return;

    try {
      const date = selectedDate.toISOString().split("T")[0];
      const startDateTime = convertToUTC(selectedDate, activityData.startTime);
      const endDateTime = convertToUTC(selectedDate, activityData.endTime);

      const { data, error } = await supabase
        .from("activities")
        .insert([
          {
            date,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            activity_name: activityData.activityName,
            activity_type_id: activityData.activityTypeId,
            notes: activityData.notes || null,
            user_id: user.id,
          },
        ])
        .select("*")
        .single();

      if (error) throw error;
      setActivities((prevActivities) => [...prevActivities, data]);
      toast({
        title: "Success",
        description: "Activity added successfully",
      });
      return data;
    } catch (err) {
      console.error("Error in addActivity:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add activity",
      });
      throw err;
    }
  };

  const updateActivity = async (
    id: string,
    updatedFields: Partial<Activity>
  ) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update(updatedFields)
        .eq("id", id);

      if (error) throw error;
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === id ? { ...activity, ...updatedFields } : activity
        )
      );
      toast({
        title: "Success",
        description: "Activity updated successfully",
      });
    } catch (err) {
      console.error("Error updating activity:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update activity",
      });
      throw err;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);

      if (error) throw error;
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== id)
      );
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete activity",
      });
      throw err;
    }
  };

  return {
    activities,
    activityTypes,
    loadActivities: loadData,
    isLoading,
    user,
    addActivity,
    updateActivity,
    deleteActivity,
    setActivityTypes,
  };
};
