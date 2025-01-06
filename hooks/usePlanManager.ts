import { useState, useCallback, useEffect } from "react";
import { Plan } from "@/types/plans";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";
import { convertToUTC, formatTimeForDisplay } from "@/utils/timeUtils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./use-toast";
import { PlanInput } from "@/lib/validations/plan";

export const usePlanManager = (selectedDate: Date) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const loadPlans = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("date", formattedDate)
        .eq("user_id", user.id);

      if (error) throw error;
      if (data) setPlans(data);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load plans",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate, supabase, toast]);

  const addPlan = async (data: PlanInput) => {
    if (!user) return;

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const { data: newPlan, error } = await supabase
        .from("plans")
        .insert([
          {
            plan_name: data.plan_name,
            start_time: data.start_time,
            end_time: data.end_time,
            date: formattedDate,
            user_id: user.id,
            is_finished: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (newPlan) {
        setPlans((prev) => [...prev, newPlan]);
        toast({
          title: "Success",
          description: "Plan added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add plan",
      });
    }
  };

  const updatePlan = async (id: string, data: PlanInput) => {
    if (!user) return;

    try {
      const { data: updatedPlan, error } = await supabase
        .from("plans")
        .update({
          plan_name: data.plan_name,
          start_time: data.start_time,
          end_time: data.end_time,
          is_finished: data.is_finished,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      if (updatedPlan) {
        setPlans((prev) =>
          prev.map((plan) => (plan.id === id ? updatedPlan : plan))
        );
        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update plan",
      });
    }
  };

  const deletePlan = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete plan",
      });
    }
  };

  const togglePlan = async (plan: Plan) => {
    if (!user) return;

    try {
      const { data: updatedPlan, error } = await supabase
        .from("plans")
        .update({
          is_finished: !plan.is_finished,
        })
        .eq("id", plan.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      if (updatedPlan) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? updatedPlan : p))
        );
      }
    } catch (error) {
      console.error("Error toggling plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update plan status",
      });
    }
  };

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    plans,
    isLoading,
    loadPlans,
    addPlan,
    updatePlan,
    deletePlan,
    togglePlan,
  };
};
