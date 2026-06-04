import { useState } from "react";
import { useListClients, getListClientsQueryKey, useDeleteClient, ListClientsParams, Client } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, MoreHorizontal, Edit, Trash2, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ClientFormDialog } from "@/components/ClientFormDialog";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<ListClientsParams>({
    page: 1,
    limit: 10,
    search: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data, isLoading } = useListClients(params, {
    query: { queryKey: getListClientsQueryKey(params) }
  });

  const deleteClient = useDeleteClient();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClient.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Success", description: "Client deleted successfully" });
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
          }
        }
      );
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleExportCsv = () => {
    const urlParams = new URLSearchParams();
    if (params.status && params.status !== "all") urlParams.append("status", params.status);
    if (params.serviceType && params.serviceType !== "all") urlParams.append("serviceType", params.serviceType);
    if (params.paymentStatus && params.paymentStatus !== "all") urlParams.append("paymentStatus", params.paymentStatus);
    window.open(`/api/export/csv?${urlParams.toString()}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{status}</Badge>;
      case "Suspended": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{status}</Badge>;
      case "Expired": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{status}</Badge>;
      case "Pending": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{status}</Badge>;
      case "Overdue": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Clients</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button className="bg-primary text-white" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-8"
                value={params.search || ""}
                onChange={(e) => setParams(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
            <div className="flex gap-2">
              <Select value={params.status || "all"} onValueChange={(v) => setParams(prev => ({ ...prev, status: v as any, page: 1 }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={params.serviceType || "all"} onValueChange={(v) => setParams(prev => ({ ...prev, serviceType: v as any, page: 1 }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Minecraft Hosting">Minecraft</SelectItem>
                  <SelectItem value="VPS Hosting">VPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead className="text-right">Monthly Price</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.clients && data.clients.length > 0 ? (
                    data.clients.map((client) => (
                      <TableRow key={client.id} className="border-border">
                        <TableCell>
                          <div className="font-medium text-foreground">{client.fullName}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-foreground">{client.serviceType}</div>
                          <div className="text-sm text-muted-foreground">{client.planName}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>{getPaymentBadge(client.paymentStatus)}</TableCell>
                        <TableCell>
                          {format(new Date(client.renewalDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          NPR {client.monthlyPrice.toLocaleString()}
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
                              <DropdownMenuItem onClick={() => openEditModal(client)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(client.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No clients found.
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
      
      <ClientFormDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        client={selectedClient} 
      />
    </div>
  );
}