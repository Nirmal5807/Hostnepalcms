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
import { useCreateClient, useUpdateClient, getListClientsQueryKey, Client, ClientInputServiceType, ClientInputPaymentStatus, ClientInputStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const clientSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  discordUsername: z.string().optional(),
  discordId: z.string().optional(),
  serviceType: z.enum(["Minecraft Hosting", "VPS Hosting"]),
  planName: z.string().min(1, "Plan name is required"),
  serverId: z.string().min(1, "Server ID is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  renewalDate: z.string().min(1, "Renewal date is required"),
  paymentStatus: z.enum(["Paid", "Pending", "Overdue"]),
  monthlyPrice: z.coerce.number().min(0, "Price must be >= 0"),
  notes: z.string().optional(),
  status: z.enum(["Active", "Suspended", "Expired"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: "",
      email: "",
      discordUsername: "",
      discordId: "",
      serviceType: "Minecraft Hosting",
      planName: "",
      serverId: "",
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      renewalDate: format(new Date(), "yyyy-MM-dd"),
      paymentStatus: "Paid",
      monthlyPrice: 0,
      notes: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (client && open) {
      form.reset({
        fullName: client.fullName,
        email: client.email,
        discordUsername: client.discordUsername || "",
        discordId: client.discordId || "",
        serviceType: client.serviceType as any,
        planName: client.planName,
        serverId: client.serverId,
        purchaseDate: client.purchaseDate ? format(new Date(client.purchaseDate), "yyyy-MM-dd") : "",
        renewalDate: client.renewalDate ? format(new Date(client.renewalDate), "yyyy-MM-dd") : "",
        paymentStatus: client.paymentStatus as any,
        monthlyPrice: client.monthlyPrice,
        notes: client.notes || "",
        status: client.status as any,
      });
    } else if (open && !client) {
      form.reset({
        fullName: "",
        email: "",
        discordUsername: "",
        discordId: "",
        serviceType: "Minecraft Hosting",
        planName: "",
        serverId: "",
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        renewalDate: format(new Date(), "yyyy-MM-dd"),
        paymentStatus: "Paid",
        monthlyPrice: 0,
        notes: "",
        status: "Active",
      });
    }
  }, [client, open, form]);

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: ClientFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: client.id, data: values as any },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Client updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values as any },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Client created successfully" });
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to create client", variant: "destructive" });
          }
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="discordUsername" render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord Username (Optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="discordId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord ID (Optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Minecraft Hosting">Minecraft Hosting</SelectItem>
                      <SelectItem value="VPS Hosting">VPS Hosting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="planName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="serverId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Server ID</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="monthlyPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Price (NPR)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="renewalDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Renewal Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

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
                {isEditing ? "Save Changes" : "Create Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}