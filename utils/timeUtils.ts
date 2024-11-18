// Obtenir le fuseau horaire de l'utilisateur actuel
const getUserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatTimeForDisplay = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};

export const getMinutesFromTime = (time: string): number => {
  try {
    if (time.includes("T")) {
      // Pour les timestamps ISO
      const date = new Date(time);
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }
    // Pour les heures au format "HH:MM AM/PM"
    const [timeStr, period] = time.split(" ");
    const [hours, minutes] = timeStr.split(":").map(Number);
    let hours24 = hours;

    if (period === "PM" && hours !== 12) {
      hours24 = hours + 12;
    } else if (period === "AM" && hours === 12) {
      hours24 = 0;
    }

    return hours24 * 60 + minutes;
  } catch (error) {
    console.error("Error in getMinutesFromTime:", error);
    return 0;
  }
};

export const convertToUTC = (baseDate: Date, timeString: string): Date => {
  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":").map(Number);

  // Convertir en format 24h
  let hours24 = hours;
  if (period === "PM" && hours !== 12) {
    hours24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hours24 = 0;
  }

  // Créer une date UTC directement avec les heures spécifiées
  return new Date(
    Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours24,
      minutes,
      0,
      0
    )
  );
};

export const getBgColor = (hexColor: string | undefined) => {
  if (!hexColor) return "rgb(var(--primary) / 0.05)";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
};
