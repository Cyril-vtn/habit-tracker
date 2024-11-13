import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HabitTracker from "./HabitTracker";
import ActivityStats from "./ActivityStats";

export default function AppTabs() {
  return (
    <Tabs defaultValue="tracker" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="tracker">Daily Tracker</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
      </TabsList>
      <TabsContent value="tracker">
        <HabitTracker />
      </TabsContent>
      <TabsContent value="stats">
        <ActivityStats />
      </TabsContent>
    </Tabs>
  );
}
