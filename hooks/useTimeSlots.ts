import { format } from "date-fns";

export const useTimeSlots = () => {
  const generateTimeSlots = () => {
    const slots = [];
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    for (let i = 0; i < 48; i++) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";

      // Format spécial pour minuit
      let formattedHours;
      if (hours === 0) {
        formattedHours = "00";
      } else if (hours === 12) {
        formattedHours = "12";
      } else {
        formattedHours = format(date, "hh");
      }

      const formattedMinutes = minutes.toString().padStart(2, "0");
      slots.push(`${formattedHours}:${formattedMinutes} ${period}`);
      date.setMinutes(date.getMinutes() + 30);
    }

    slots.push("11:59 PM");

    return slots;
  };

  return generateTimeSlots();
};
