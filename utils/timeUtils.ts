export const formatTimeForDisplay = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};

export const getMinutesFromTime = (time: string): number => {
  try {
    // Si c'est un timestamp ISO
    if (time.includes("T")) {
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.getHours() * 60 + date.getMinutes();
    }

    // Pour les timeSlots (format "HH:MM AM/PM")
    if (time.includes(" ")) {
      const [timeStr, period] = time.split(" ");
      const [hours, minutes] = timeStr.split(":").map(Number);
      let totalHours = hours;

      if (period === "PM" && hours !== 12) {
        totalHours += 12;
      } else if (period === "AM" && hours === 12) {
        totalHours = 0;
      }

      return totalHours * 60 + minutes;
    }

    // Pour le format simple "HH:MM"
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  } catch (error) {
    return 0; // Retourner 0 pour les formats non reconnus
  }
};

export const getBgColor = (hexColor: string | undefined) => {
  if (!hexColor) return "rgb(var(--primary) / 0.05)";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
};
