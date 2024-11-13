export interface ActivityType {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  activity_name: string;
  activity_type_id: string;
  activity_type?: ActivityType;
  notes?: string | null;
  created_at: string;
}
