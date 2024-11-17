// Obtenir le fuseau horaire de l'utilisateur actuel
const getUserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatTimeForDisplay = (timestamp: string): string => {
  // Convertir le timestamp UTC en heure locale
  const date = new Date(timestamp);
  const localDate = new Date(
    date.toLocaleString("en-US", { timeZone: getUserTimezone() })
  );

  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
};

export const getMinutesFromTime = (time: string): number => {
  try {
    if (time.includes("T")) {
      // Pour les timestamps ISO
      const utcDate = new Date(time);
      const localDate = new Date(
        utcDate.toLocaleString("en-US", { timeZone: getUserTimezone() })
      );
      return localDate.getHours() * 60 + localDate.getMinutes();
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
    return 0; // Valeur par défaut en cas d'erreur
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

  // Créer une date locale avec les heures spécifiées
  const localDate = new Date(baseDate);
  localDate.setHours(hours24, minutes, 0, 0);

  // Convertir en UTC en tenant compte du décalage horaire
  const utcTimestamp = Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    hours24,
    minutes,
    0,
    0
  );

  // Ajuster pour le décalage horaire local
  const offsetInMinutes = localDate.getTimezoneOffset();
  return new Date(utcTimestamp + offsetInMinutes * 60 * 1000);
};

export const getBgColor = (hexColor: string | undefined) => {
  if (!hexColor) return "rgb(var(--primary) / 0.05)";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
};
