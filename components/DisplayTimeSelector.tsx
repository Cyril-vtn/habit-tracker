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
    <div className="flex flex-row sm:gap-4 gap-2 mb-4 mt-4">
      <div className="w-full sm:w-auto">
        <Select
          value={displayTimes.startTime}
          onValueChange={(time) => onTimeChange("start", time)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
      <div className="w-full sm:w-auto">
        <Select
          value={displayTimes.endTime}
          onValueChange={(time) => onTimeChange("end", time)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
