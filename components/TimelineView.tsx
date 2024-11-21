import { Activity, ActivityType } from "@/types/activities";
import { useActivityManager } from "@/hooks/useActivityManager";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useEffect, useRef, useState } from "react";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import { getBgColor, getMinutesFromTime } from "@/utils/timeUtils";

interface TimelineViewProps {
  initialDate: Date;
}

interface DayColumnProps {
  date: Date;
  timeSlots: string[];
  activities: Activity[];
}

export function TimelineView({ initialDate }: TimelineViewProps) {
  const timeSlots = useTimeSlots();
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { loadActivitiesForDateRange } = useActivityManager(initialDate);
  const [activitiesByDate, setActivitiesByDate] = useState<{
    [key: string]: Activity[];
  }>({});

  // Initialiser les dates visibles
  useEffect(() => {
    const start = startOfWeek(initialDate);
    const dates = Array.from({ length: 14 }, (_, i) => addDays(start, i));
    setVisibleDates(dates);
  }, [initialDate]);

  // Charger les activités pour les dates visibles
  useEffect(() => {
    const loadActivities = async () => {
      if (visibleDates.length === 0) return;
      const startDate = visibleDates[0];
      const endDate = visibleDates[visibleDates.length - 1];

      const activities = await loadActivitiesForDateRange(startDate, endDate);
      if (!activities) return;

      const grouped = activities.reduce((acc, activity) => {
        const date = activity.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
      }, {} as { [key: string]: Activity[] });

      setActivitiesByDate((prev) => ({ ...prev, ...grouped }));
    };

    loadActivities();
  }, [visibleDates, loadActivitiesForDateRange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current || isLoadingMore) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const isNearEnd = scrollWidth - (scrollLeft + clientWidth) < 200;
    const isNearStart = scrollLeft < 200;

    if (isNearEnd) {
      loadMoreDates("next");
    } else if (isNearStart) {
      loadMoreDates("previous");
    }
  };

  const loadMoreDates = (direction: "next" | "previous") => {
    setIsLoadingMore(true);

    // Créer un Set avec les dates existantes
    const existingDatesSet = new Set(
      visibleDates.map((date) => format(date, "yyyy-MM-dd"))
    );

    let newDates: Date[] = [];
    let datesAdded = 0;

    if (direction === "next") {
      let currentDate = addDays(visibleDates[visibleDates.length - 1], 1);
      while (datesAdded < 7) {
        const dateString = format(currentDate, "yyyy-MM-dd");
        if (!existingDatesSet.has(dateString)) {
          newDates.push(currentDate);
          existingDatesSet.add(dateString); // Ajouter au Set pour éviter les doublons
          datesAdded++;
        }
        currentDate = addDays(currentDate, 1);
      }
    } else {
      let currentDate = subDays(visibleDates[0], 1);
      while (datesAdded < 7) {
        const dateString = format(currentDate, "yyyy-MM-dd");
        if (!existingDatesSet.has(dateString)) {
          newDates.unshift(currentDate);
          existingDatesSet.add(dateString); // Ajouter au Set pour éviter les doublons
          datesAdded++;
        }
        currentDate = subDays(currentDate, 1);
      }
    }

    // Mettre à jour les dates visibles en évitant les doublons
    setVisibleDates((prev) => {
      const allDates =
        direction === "next" ? [...prev, ...newDates] : [...newDates, ...prev];
      const uniqueDates = Array.from(
        new Map(
          allDates.map((date) => [format(date, "yyyy-MM-dd"), date])
        ).values()
      );
      return uniqueDates;
    });

    setIsLoadingMore(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-scroll overflow-y-scroll"
          style={{ height: "calc(100vh - 180px)" }}
          onScroll={handleScroll}
        >
          <div className="flex flex-col min-w-max">
            {/* En-têtes fixes */}
            <div className="sticky top-0 z-20 flex bg-background">
              {/* En-tête vide pour la colonne des heures */}
              <div className="w-20 flex-shrink-0 border-r h-14" />
              {/* En-têtes des jours */}
              <div className="flex">
                {visibleDates.map((date) => (
                  <div
                    key={format(date, "yyyy-MM-dd")}
                    className="w-48 flex-shrink-0 border-r p-2 text-center"
                  >
                    {format(date, "EEE dd/MM")}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-1">
              {/* Colonne des heures fixe */}
              <div className="sticky left-0 z-10 w-20 flex-shrink-0 bg-background">
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-10 flex items-center justify-end pr-2 text-sm border-b"
                  >
                    {time}
                  </div>
                ))}
              </div>

              {/* Grille des activités */}
              <div className="flex flex-1">
                {visibleDates.map((date) => (
                  <DayColumn
                    key={format(date, "yyyy-MM-dd")}
                    date={date}
                    timeSlots={timeSlots}
                    activities={
                      activitiesByDate[format(date, "yyyy-MM-dd")] || []
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ date, timeSlots, activities }: DayColumnProps) {
  return (
    <div className="flex-shrink-0 w-48 relative border-r">
      <div className="relative">
        {timeSlots.map((time) => (
          <div key={time} className="h-10 border-b border-dashed" />
        ))}

        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            timeSlots={timeSlots}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({
  activity,
  timeSlots,
}: {
  activity: Activity;
  timeSlots: string[];
}) {
  const startMinutes = getMinutesFromTime(activity.start_time);
  const endMinutes = getMinutesFromTime(activity.end_time);
  const duration = endMinutes - startMinutes;

  const top = Math.floor(startMinutes / 30) * 40;
  const height = Math.ceil(duration / 30) * 40;

  return (
    <div
      className="absolute left-0 right-0 mx-1 rounded-md p-1 text-sm overflow-hidden"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: activity.activity_type?.color
          ? getBgColor(activity.activity_type.color)
          : "bg-primary",
      }}
    >
      <div className="font-medium">{activity.activity_name}</div>
      <div className="text-xs opacity-75">{activity.activity_type?.name}</div>
    </div>
  );
}
