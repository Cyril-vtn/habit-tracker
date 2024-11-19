"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  activityTypeSchema,
  type ActivityTypeInput,
} from "@/lib/validations/activityType";
import { ActivityType } from "@/types/activities";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ActivityTypeManagerProps {
  activityTypes: ActivityType[];
}

export default function ActivityTypeManager({
  activityTypes,
}: ActivityTypeManagerProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const form = useForm<ActivityTypeInput>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });

  const editForm = useForm<ActivityTypeInput>({
    resolver: zodResolver(activityTypeSchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });

  const startEditing = (type: ActivityType) => {
    setEditingId(type.id);
    editForm.reset({
      name: type.name,
      color: type.color || "#000000",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    editForm.reset();
  };

  const handleAddType = async (data: ActivityTypeInput) => {
    try {
      const { error } = await supabase
        .from("activity_types")
        .insert([{ name: data.name, color: data.color, user_id: user?.id }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity type created successfully",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create activity type",
      });
    }
  };

  const updateActivityType = async (id: string, data: ActivityTypeInput) => {
    try {
      const { error } = await supabase
        .from("activity_types")
        .update({ name: data.name, color: data.color })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity type updated successfully",
      });
      cancelEditing();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update activity type",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({
        name: "",
        color: "#000000",
      });
      editForm.reset();
      setEditingId(null);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Activity Types</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Activity Types</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddType)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Type Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Type</Button>
            </form>
          </Form>

          <div className="space-y-3">
            {activityTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                {editingId === type.id ? (
                  <Form {...editForm}>
                    <form
                      onSubmit={editForm.handleSubmit((data) =>
                        updateActivityType(type.id, data)
                      )}
                      className="flex-1 flex items-center gap-3"
                    >
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="color" {...field} className="w-20" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="icon" variant="ghost">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <>
                    <div className="flex-1">{type.name}</div>
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: type.color || "#000000" }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
