export const getMinutesFromTime = (time: string): number => {
  const [timeStr, period] = time.split(" ");
  const [hours, minutes] = timeStr.split(":").map(Number);
  let totalHours = hours;

  if (period === "PM" && hours !== 12) {
    totalHours += 12;
  } else if (period === "AM" && hours === 12) {
    totalHours = 0;
  }

  return totalHours * 60 + minutes;
};

export const getBgColor = (hexColor: string | undefined) => {
  if (!hexColor) return "rgb(var(--primary) / 0.05)";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
};
