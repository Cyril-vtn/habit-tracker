"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stats, setStats] = useState<ActivityStat[]>([]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select(
          `
          *,
          activity_type:activity_types(*)
        `
        )
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      if (data) {
        const statsByType: { [key: string]: ActivityStat } = {};

        data.forEach((activity) => {
          const type = activity.activity_type?.name || "Unknown";
          const startMinutes = getMinutesFromTime(activity.start_time);
          const endMinutes = getMinutesFromTime(activity.end_time);
          const duration = (endMinutes - startMinutes) / 60; // Convert to hours

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
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium mb-2">Start Date</h3>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
            />
          </div>
          <div>
            <h3 className="font-medium mb-2">End Date</h3>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => date && setEndDate(date)}
            />
          </div>
        </div>
        <Button onClick={loadStats} className="mt-4">
          Load Statistics
        </Button>
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
