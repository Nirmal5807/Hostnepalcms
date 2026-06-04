import { useState } from "react";
import { useListTickets, getListTicketsQueryKey, useDeleteTicket, ListTicketsParams, Ticket } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { TicketFormDialog } from "@/components/TicketFormDialog";

export default function Tickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<ListTicketsParams>({
    page: 1,
    limit: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data, isLoading } = useListTickets(params, {
    query: { queryKey: getListTicketsQueryKey(params) }
  });

  const deleteTicket = useDeleteTicket();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      deleteTicket.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Ticket deleted successfully" });
            queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to delete ticket", variant: "destructive" });
          }
        }
      );
    }
  };

  const openAddModal = () => {
    setSelectedTicket(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{status}</Badge>;
      case "In Progress": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{status}</Badge>;
      case "Resolved": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{status}</Badge>;
      case "Closed": return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Tickets</h1>
        <Button className="bg-primary text-white" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" /> Add Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Management</CardTitle>
          <div className="flex mt-4">
            <Select value={params.status || "all"} onValueChange={(v) => setParams(prev => ({ ...prev, status: v as any, page: 1 }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border border-border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.tickets && data.tickets.length > 0 ? (
                    data.tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-border">
                        <TableCell className="font-mono text-sm">{ticket.ticketId}</TableCell>
                        <TableCell>{ticket.clientName || "Unknown"}</TableCell>
                        <TableCell className="font-medium text-foreground max-w-[300px] truncate">{ticket.subject}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditModal(ticket)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(ticket.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParams(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={params.page === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {params.page} of {data.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParams(prev => ({ ...prev, page: Math.min(data.totalPages, (prev.page || 1) + 1) }))}
                disabled={params.page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TicketFormDialog 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        ticket={selectedTicket}
      />
    </div>
  );
}