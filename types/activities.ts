export interface Activity {
  id: string;
  activity_name: string;
  activity_type_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
  user_id: string;
  date: string;
}

export interface ActivityType {
  id: string;
  name: string;
  color: string;
  user_id: string;
}
