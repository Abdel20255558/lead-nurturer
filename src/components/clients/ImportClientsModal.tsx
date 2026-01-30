import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface ImportRow {
  name: string;
  address?: string;
  activity?: string;
  email?: string;
  website?: string;
  phone_fixed?: string;
  phone_mobile?: string;
  company_type?: 'SA' | 'Non SA';
  notes?: string;
}

interface ImportResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Column name mappings (French -> English)
const COLUMN_MAPPINGS: Record<string, keyof ImportRow> = {
  // Name
  'nom': 'name',
  'name': 'name',
  'nom client': 'name',
  'client': 'name',
  'entreprise': 'name',
  'société': 'name',
  'societe': 'name',
  'raison sociale': 'name',
  
  // Address
  'adresse': 'address',
  'address': 'address',
  
  // Activity
  'activité': 'activity',
  'activite': 'activity',
  'activity': 'activity',
  'secteur': 'activity',
  'domaine': 'activity',
  
  // Email
  'email': 'email',
  'e-mail': 'email',
  'mail': 'email',
  'courriel': 'email',
  
  // Website
  'site web': 'website',
  'site': 'website',
  'website': 'website',
  'url': 'website',
  
  // Phone fixed
  'téléphone fixe': 'phone_fixed',
  'telephone fixe': 'phone_fixed',
  'tel fixe': 'phone_fixed',
  'fixe': 'phone_fixed',
  'phone fixed': 'phone_fixed',
  
  // Phone mobile
  'téléphone mobile': 'phone_mobile',
  'telephone mobile': 'phone_mobile',
  'tel mobile': 'phone_mobile',
  'mobile': 'phone_mobile',
  'téléphone': 'phone_mobile',
  'telephone': 'phone_mobile',
  'tel': 'phone_mobile',
  'phone': 'phone_mobile',
  'gsm': 'phone_mobile',
  
  // Company type
  'type société': 'company_type',
  'type societe': 'company_type',
  'type': 'company_type',
  'company type': 'company_type',
  
  // Notes
  'notes': 'notes',
  'note': 'notes',
  'commentaire': 'notes',
  'commentaires': 'notes',
  'remarque': 'notes',
  'remarques': 'notes',
};

export function ImportClientsModal({ isOpen, onClose }: ImportClientsModalProps) {
  const { createClient } = useClients();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | undefined)[][];

      if (jsonData.length < 2) {
        toast({
          title: 'Fichier vide',
          description: 'Le fichier ne contient pas de données.',
          variant: 'destructive',
        });
        return;
      }

      // Get headers and map them
      const headers = (jsonData[0] as string[]).map(h => String(h || '').toLowerCase().trim());
      const columnMap: Record<number, keyof ImportRow> = {};
      
      headers.forEach((header, index) => {
        const mappedField = COLUMN_MAPPINGS[header];
        if (mappedField) {
          columnMap[index] = mappedField;
        }
      });

      // Check if we have at least a name column
      const hasNameColumn = Object.values(columnMap).includes('name');
      if (!hasNameColumn) {
        toast({
          title: 'Colonne "Nom" manquante',
          description: 'Le fichier doit contenir une colonne "Nom" ou "Nom client".',
          variant: 'destructive',
        });
        return;
      }

      // Parse rows
      const rows: ImportRow[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const importRow: ImportRow = { name: '' };
        
        Object.entries(columnMap).forEach(([indexStr, field]) => {
          const index = parseInt(indexStr);
          const value = row[index];
          if (value !== undefined && value !== null && value !== '') {
            if (field === 'company_type') {
              const strValue = String(value).toUpperCase();
              importRow[field] = strValue === 'SA' ? 'SA' : 'Non SA';
            } else {
              (importRow as any)[field] = String(value).trim();
            }
          }
        });

        // Only add if name is present
        if (importRow.name) {
          rows.push(importRow);
        }
      }

      if (rows.length === 0) {
        toast({
          title: 'Aucune donnée valide',
          description: 'Le fichier ne contient aucun client avec un nom valide.',
          variant: 'destructive',
        });
        return;
      }

      setParsedData(rows);
      setStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Erreur de lecture',
        description: 'Impossible de lire le fichier. Vérifiez le format.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStep('importing');
    setImportProgress(0);
    setImportResults([]);

    const results: ImportResult[] = [];
    
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      try {
        await createClient.mutateAsync({
          name: row.name,
          address: row.address,
          activity: row.activity,
          email: row.email,
          website: row.website,
          phone_fixed: row.phone_fixed,
          phone_mobile: row.phone_mobile,
          company_type: row.company_type,
          notes: row.notes,
          status: 'not_contacted',
        });

        results.push({
          row: i + 1,
          name: row.name,
          success: true,
        });
      } catch (error: any) {
        results.push({
          row: i + 1,
          name: row.name,
          success: false,
          error: error.message || 'Erreur inconnue',
        });
      }

      setImportProgress(((i + 1) / parsedData.length) * 100);
      setImportResults([...results]);
    }

    setIsImporting(false);
    setStep('complete');

    const successCount = results.filter(r => r.success).length;
    toast({
      title: 'Import terminé',
      description: `${successCount} client(s) importé(s) sur ${parsedData.length}.`,
    });
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setImportProgress(0);
    setImportResults([]);
    setStep('upload');
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportProgress(0);
    setImportResults([]);
    setStep('upload');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importer des clients
          </DialogTitle>
          <DialogDescription>
            Importez des clients depuis un fichier Excel (.xlsx, .xls) ou CSV.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Cliquez pour sélectionner un fichier
              </p>
              <p className="text-xs text-muted-foreground">
                Formats supportés: Excel (.xlsx, .xls) ou CSV
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Colonnes reconnues :</p>
              <p className="text-muted-foreground">
                Nom/Client, Adresse, Activité/Secteur, Email, Site web, Téléphone fixe, Téléphone mobile, Type société, Notes
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">{parsedData.length}</span> client(s) trouvé(s) dans le fichier
              </p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" />
                Changer de fichier
              </Button>
            </div>

            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-4 space-y-2">
                {parsedData.slice(0, 20).map((row, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground w-8">{index + 1}.</span>
                    <span className="font-medium flex-1">{row.name}</span>
                    {row.activity && <Badge variant="outline">{row.activity}</Badge>}
                    {row.email && <span className="text-muted-foreground text-xs">{row.email}</span>}
                  </div>
                ))}
                {parsedData.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ... et {parsedData.length - 20} autres
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importer {parsedData.length} client(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Import en cours...</p>
              <p className="text-sm text-muted-foreground">
                {importResults.length} / {parsedData.length} traité(s)
              </p>
            </div>
            <Progress value={importProgress} />
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <p className="text-lg font-medium">Import terminé</p>
              <p className="text-sm text-muted-foreground">
                {importResults.filter(r => r.success).length} client(s) importé(s) avec succès
              </p>
            </div>

            {importResults.some(r => !r.success) && (
              <ScrollArea className="h-32 border rounded-lg">
                <div className="p-4 space-y-2">
                  {importResults.filter(r => !r.success).map((result, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="font-medium">{result.name}</span>
                      <span className="text-muted-foreground text-xs">{result.error}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Importer d'autres fichiers
              </Button>
              <Button onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
