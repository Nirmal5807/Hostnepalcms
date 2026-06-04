import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket, useUpdateTicket, getListTicketsQueryKey, Ticket } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ticketSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  subject: z.string().min(1, "Subject is required"),
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]),
  notes: z.string().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
}

export function TicketFormDialog({ open, onOpenChange, ticket }: TicketFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!ticket;

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      clientId: "",
      subject: "",
      status: "Open",
      notes: "",
    },
  });

  useEffect(() => {
    if (ticket && open) {
      form.reset({
        clientId: ticket.clientId,
        subject: ticket.subject,
        status: ticket.status as any,
        notes: ticket.notes || "",
      });
    } else if (open && !ticket) {
      form.reset({
        clientId: "",
        subject: "",
        status: "Open",
        notes: "",
      });
    }
  }, [ticket, open, form]);

  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: TicketFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: ticket.id, data: {
          subject: values.subject,
          status: values.status as any,
          notes: values.notes,
        } },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Ticket updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values as any },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Ticket created successfully" });
            queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Ticket" : "Add New Ticket"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField control={form.control} name="clientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Client ID</FormLabel>
                <FormControl><Input {...field} disabled={isEditing} placeholder="Enter Client UUID" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}