import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Filter, Plus, MoreHorizontal, Phone, Mail, Globe, ArrowUpDown, X, Trash2, Edit, Eye, Upload } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { Client, ClientStatus, STATUS_LABELS, CONTACT_METHOD_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';
import { ImportClientsModal } from './ImportClientsModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type SortField = 'name' | 'created_at' | 'last_action_at' | 'next_follow_up_at';
type SortOrder = 'asc' | 'desc';

export function ClientsTable() {
  const { clients, isLoading, deleteClient, markAsRejected } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all' | 'to_follow_up'>('all');
  const [activityFilter, setActivityFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToReject, setClientToReject] = useState<Client | null>(null);

  const activities = useMemo(() => {
    const set = new Set(clients.map(c => c.activity).filter(Boolean));
    return Array.from(set) as string[];
  }, [clients]);

  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.activity?.toLowerCase().includes(query) ||
        c.phone_mobile?.includes(query) ||
        c.phone_fixed?.includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'to_follow_up') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(c => {
        if (!c.next_follow_up_at) return false;
        return new Date(c.next_follow_up_at) <= today;
      });
    } else if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Activity filter
    if (activityFilter) {
      result = result.filter(c => c.activity === activityFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'last_action_at':
          aVal = a.last_action_at ? new Date(a.last_action_at) : new Date(0);
          bVal = b.last_action_at ? new Date(b.last_action_at) : new Date(0);
          break;
        case 'next_follow_up_at':
          aVal = a.next_follow_up_at ? new Date(a.next_follow_up_at) : new Date('2099-12-31');
          bVal = b.next_follow_up_at ? new Date(b.next_follow_up_at) : new Date('2099-12-31');
          break;
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return result;
  }, [clients, searchQuery, statusFilter, activityFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: ClientStatus) => {
    const variants: Record<ClientStatus, string> = {
      not_contacted: 'bg-muted text-muted-foreground',
      in_progress: 'bg-primary/10 text-primary',
      rejected: 'bg-destructive/10 text-destructive',
    };
    return <Badge className={variants[status]}>{STATUS_LABELS[status]}</Badge>;
  };

  const handleOpenDetail = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      await deleteClient.mutateAsync(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  const handleReject = async () => {
    if (clientToReject) {
      await markAsRejected.mutateAsync(clientToReject.id);
      setClientToReject(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setActivityFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || activityFilter;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="to_follow_up">À relancer</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Activity Filter */}
          {activities.length > 0 && (
            <Select value={activityFilter || "all"} onValueChange={(v) => setActivityFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Activité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes activités</SelectItem>
                {activities.map(activity => (
                  <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => { setSelectedClient(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-2">
                  Nom
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>Activité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('last_action_at')}>
                <div className="flex items-center gap-2">
                  Dernière action
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('next_follow_up_at')}>
                <div className="flex items-center gap-2">
                  Prochaine relance
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? 'Aucun client ne correspond aux filtres.' : 'Aucun client. Cliquez sur "Ajouter" pour commencer.'}
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filteredClients.map((client) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="table-row-hover"
                    onClick={() => handleOpenDetail(client)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.activity || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {client.phone_mobile && (
                          <a href={`tel:${client.phone_mobile}`} onClick={(e) => e.stopPropagation()}>
                            <Phone className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                        {client.email && (
                          <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()}>
                            <Mail className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                        {client.website && (
                          <a href={client.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Globe className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      {client.contact_method ? CONTACT_METHOD_LABELS[client.contact_method] : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.last_action_at
                        ? format(new Date(client.last_action_at), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {client.next_follow_up_at ? (
                        <span className={
                          new Date(client.next_follow_up_at) <= new Date()
                            ? 'text-warning font-medium'
                            : 'text-muted-foreground'
                        }>
                          {format(new Date(client.next_follow_up_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDetail(client)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {client.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => setClientToReject(client)}>
                              <X className="h-4 w-4 mr-2" />
                              Marquer rejeté
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setClientToDelete(client)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} 
          {hasActiveFilters && ` (sur ${clients.length} total)`}
        </p>
      )}

      {/* Modals */}
      <ClientFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedClient(null); }}
        client={selectedClient}
      />

      <ClientDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedClient(null); }}
        client={selectedClient}
        onEdit={() => { setIsDetailOpen(false); setIsFormOpen(true); }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client "{clientToDelete?.name}" et tout son historique seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!clientToReject} onOpenChange={() => setClientToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme rejeté ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le client "{clientToReject?.name}" sera marqué comme rejeté. Vous pourrez toujours le modifier plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <ImportClientsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
