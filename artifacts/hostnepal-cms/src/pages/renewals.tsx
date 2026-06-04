import { useGetRenewalReminders, getGetRenewalRemindersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Renewals() {
  const { toast } = useToast();
  const { data, isLoading } = useGetRenewalReminders({
    query: { queryKey: getGetRenewalRemindersQueryKey() }
  });

  const [selectedClient, setSelectedClient] = useState<any>(null);

  const getMessageTemplate = (client: any, days: number) => {
    return `📢 **Service Renewal Reminder**
Hello ${client.fullName} ${client.discordUsername ? `(Discord: ${client.discordUsername})` : ''}
Your ${client.serviceType} service **${client.planName}** (Server: ${client.serverId}) is due for renewal in **${days} day(s)**.
Renewal Date: ${format(new Date(client.renewalDate), 'MMMM d, yyyy')}
Monthly Price: NPR ${client.monthlyPrice.toLocaleString()}
Please renew to avoid service interruption. Contact us if you have any questions.
— HostNepal Team`;
  };

  const copyToClipboard = () => {
    if (!selectedClient) return;
    navigator.clipboard.writeText(getMessageTemplate(selectedClient.client, selectedClient.daysUntilRenewal));
    toast({
      title: "Copied to clipboard",
      description: "Reminder message has been copied to clipboard.",
    });
  };

  const getUrgencyClasses = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-500/10 border-red-500/30 text-red-500";
      case "warning": return "bg-orange-500/10 border-orange-500/30 text-orange-500";
      case "notice": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Renewal Reminders</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Upcoming Expirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {data?.reminders && data.reminders.length > 0 ? (
                data.reminders.map((reminder) => (
                  <div 
                    key={reminder.client.id} 
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg ${getUrgencyClasses(reminder.urgency || "notice")}`}
                  >
                    <div className="mb-4 md:mb-0">
                      <div className="font-bold text-lg mb-1">{reminder.client.fullName}</div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm opacity-90">
                        <div><span className="font-semibold">Service:</span> {reminder.client.serviceType} ({reminder.client.planName})</div>
                        <div><span className="font-semibold">Server ID:</span> {reminder.client.serverId}</div>
                        <div><span className="font-semibold">Expires:</span> {format(new Date(reminder.client.renewalDate), 'MMM d, yyyy')}</div>
                        <div><span className="font-semibold">Price:</span> NPR {reminder.client.monthlyPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-xl font-bold">
                        In {reminder.daysUntilRenewal} {reminder.daysUntilRenewal === 1 ? 'day' : 'days'}
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full md:w-auto"
                        onClick={() => setSelectedClient(reminder)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Generate Message
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground border border-border rounded-lg">
                  No upcoming renewals in the next 7 days.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Renewal Reminder Message</DialogTitle>
            <DialogDescription>
              Copy and send this message to the client via Discord or email.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-background border border-border rounded-md font-mono text-sm whitespace-pre-wrap text-foreground">
            {selectedClient && getMessageTemplate(selectedClient.client, selectedClient.daysUntilRenewal)}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedClient(null)}>Close</Button>
            <Button className="bg-primary text-white hover:bg-primary/90" onClick={copyToClipboard}>Copy to Clipboard</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}