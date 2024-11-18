"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ActivityStat {
  type: string;
  duration: number;
  color: string;
}

const getMinutesFromTime = (time: string): number => {
  if (time.includes("T")) {
    const date = new Date(time);
    return date.getHours() * 60 + date.getMinutes();
  }
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (
  startMinutes: number,
  endMinutes: number
): number => {
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  return (endMinutes - startMinutes) / 60;
};

export default function ActivityStats() {
  const { user } = useAuth();
  const today = new Date();
  const [date, setDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [stats, setStats] = useState<ActivityStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const loadStats = useCallback(async () => {
    if (!date?.from || !date?.to) return;
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (!user) {
        console.log("No user found");
        return;
      }

      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          activity_type:activity_types(*)
        `
        )
        .eq("user_id", user.id)
        .gte("date", format(date.from, "yyyy-MM-dd"))
        .lte("date", format(date.to, "yyyy-MM-dd"));

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const statsByType: { [key: string]: ActivityStat } = {};
        data.forEach((activity) => {
          if (!activity.activity_type) {
            console.log("Activity without type:", activity);
            return;
          }

          const type = activity.activity_type?.name || "Unknown";
          const startMinutes = getMinutesFromTime(activity.start_time);
          const endMinutes = getMinutesFromTime(activity.end_time);
          const duration = calculateDuration(startMinutes, endMinutes);

          if (!statsByType[type]) {
            statsByType[type] = {
              type,
              duration: 0,
              color: activity.activity_type?.color || "#000000",
            };
          }
          statsByType[type].duration += duration;
        });

        const validStats = Object.values(statsByType)
          .filter((stat) => stat.duration > 0)
          .map((stat) => ({
            ...stat,
            duration: Math.round(stat.duration * 2) / 2,
          }));

        setStats(validStats);
      } else {
        console.log("No data found for the selected date range");
        setStats([]);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [date, user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-8">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className=" flex flex-col px-4 mt-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {stats.length > 0 ? (
        <div className="px-6 space-y-2">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Activity Distribution
          </h2>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  dataKey="duration"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  className="sm:outerRadius-[150px] outerRadius-[100px]"
                  outerRadius={100}
                >
                  {stats.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} hours`,
                    "Duration",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="px-6 text-center text-sm text-muted-foreground mt-4">
          No activity data found
        </div>
      )}
    </div>
  );
}
