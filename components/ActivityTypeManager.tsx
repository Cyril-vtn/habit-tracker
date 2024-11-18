"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ActivityType } from "@/types/activities";
import { Edit2, Trash2, Plus, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ActivityTypeManagerProps {
  activityTypes: ActivityType[];
}

export default function ActivityTypeManager({
  activityTypes,
}: ActivityTypeManagerProps) {
  const { user } = useAuth();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#000000");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const supabase = createClientComponentClient();

  const startEditing = (type: ActivityType) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditColor(type.color || "#000000");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const updateActivityType = async (id: string) => {
    try {
      const { error } = await supabase
        .from("activity_types")
        .update({ name: editName, color: editColor })
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating activity type:", err);
    }
  };

  const deleteActivityType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this type?")) return;

    try {
      const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Error deleting activity type:", err);
    }
  };

  const addActivityType = async () => {
    if (!newTypeName) return;

    try {
      if (!user) return;

      const { data, error } = await supabase
        .from("activity_types")
        .insert([
          {
            name: newTypeName,
            color: newTypeColor,
            user_id: user.id,
          },
        ])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setNewTypeName("");
        setNewTypeColor("#000000");
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error("Error adding activity type:", err);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Manage Activity Types</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Activity Types</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              {activityTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                >
                  {editingId === type.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-20"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateActivityType(type.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">{type.name}</div>
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: type.color }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(type)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteActivityType(type.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add New Type</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Type name"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="w-20"
                />
                <Button onClick={addActivityType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
