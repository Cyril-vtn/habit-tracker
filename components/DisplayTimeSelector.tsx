import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisplayTimeSelectorProps {
  timeSlots: string[];
  displayTimes: {
    startTime: string;
    endTime: string;
  };
  onTimeChange: (type: "start" | "end", time: string) => void;
}

export function DisplayTimeSelector({
  timeSlots,
  displayTimes,
  onTimeChange,
}: DisplayTimeSelectorProps) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Display from</span>
        <Select
          value={displayTimes.startTime}
          onValueChange={(time) => onTimeChange("start", time)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>{displayTimes.startTime}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem
                key={time}
                value={time}
                disabled={
                  timeSlots.indexOf(time) >
                  timeSlots.indexOf(displayTimes.endTime)
                }
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">to</span>
        <Select
          value={displayTimes.endTime}
          onValueChange={(time) => onTimeChange("end", time)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>{displayTimes.endTime}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((time) => (
              <SelectItem
                key={time}
                value={time}
                disabled={
                  timeSlots.indexOf(time) <
                  timeSlots.indexOf(displayTimes.startTime)
                }
              >
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
