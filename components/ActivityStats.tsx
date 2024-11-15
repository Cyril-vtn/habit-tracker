"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ActivityStat {
  type: string;
  duration: number;
  color: string;
}

const getMinutesFromTime = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export default function ActivityStats() {
  const today = new Date();
  const [date, setDate] = useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const [stats, setStats] = useState<ActivityStat[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!date?.from || !date?.to) return;

    try {
      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          activity_type:activity_types(*)
        `
        )
        .gte("date", format(date.from, "yyyy-MM-dd"))
        .lte("date", format(date.to, "yyyy-MM-dd"));

      if (error) throw error;

      if (data) {
        const statsByType: { [key: string]: ActivityStat } = {};

        data.forEach((activity) => {
          const type = activity.activity_type?.name || "Unknown";
          const startMinutes = getMinutesFromTime(activity.start_time);
          const endMinutes = getMinutesFromTime(activity.end_time);
          const duration = (endMinutes - startMinutes) / 60;

          if (!statsByType[type]) {
            statsByType[type] = {
              type,
              duration: 0,
              color: activity.activity_type?.color || "#000000",
            };
          }
          statsByType[type].duration += duration;
        });

        setStats(Object.values(statsByType));
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="space-y-4 flex flex-col">
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
          <Button className="mt-0 w-fit" onClick={loadStats}>
            Load Statistics
          </Button>
        </div>
      </Card>

      {stats.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Activity Distribution</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  dataKey="duration"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
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
        </Card>
      )}
    </div>
  );
}
