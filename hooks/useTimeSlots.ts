import { useMemo } from "react";

export const useTimeSlots = () => {
  const timeSlots = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minutes = i % 2 === 0 ? "00" : "30";
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour.toString().padStart(2, "0")}:${minutes} ${period}`;
    });
  }, []);

  return timeSlots;
};
