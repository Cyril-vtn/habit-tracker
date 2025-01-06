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
import { useLanguage } from "@/hooks/useLanguage";
import {
  activityTypeSchema,
  type ActivityTypeInput,
} from "@/lib/validations/activityType";
import { ActivityType } from "@/types/activities";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface ActivityTypeManagerProps {
  activityTypes: ActivityType[];
  onActivityTypesChange: (types: ActivityType[]) => void;
}

export default function ActivityTypeManager({
  activityTypes,
  onActivityTypesChange,
}: ActivityTypeManagerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      const { data: newType, error } = await supabase
        .from("activity_types")
        .insert([{ name: data.name, color: data.color, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;

      onActivityTypesChange([...activityTypes, newType]);

      toast({
        title: t("common.success"),
        description: t("activityTypes.createSuccess"),
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("activityTypes.createError"),
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

      const updatedActivityTypes = activityTypes.map((type) =>
        type.id === id
          ? {
              ...type,
              name: data.name,
              color: data.color,
            }
          : type
      );
      onActivityTypesChange(updatedActivityTypes);

      toast({
        title: t("common.success"),
        description: t("activityTypes.updateSuccess"),
      });
      cancelEditing();
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("activityTypes.updateError"),
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

  const deleteActivityType = async (id: string) => {
    try {
      const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      onActivityTypesChange(activityTypes.filter((type) => type.id !== id));

      toast({
        title: t("common.success"),
        description: t("activityTypes.deleteSuccess"),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("activityTypes.deleteError"),
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("activities.manageTypes")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("activityTypes.title")}</DialogTitle>
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
                    <FormLabel>{t("activityTypes.newTypeName")}</FormLabel>
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
                    <FormLabel>{t("common.color")}</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">{t("activityTypes.addType")}</Button>
            </form>
          </Form>

          <div className="space-y-3">
            {activityTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                {editingId !== type.id ? (
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteActivityType(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
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
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
