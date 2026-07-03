import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  siteId: string | null;
  userId: string;
  onCreated?: () => void;
};

const REQUEST_TYPES = [
  { value: "conteudo", label: "Alteração de conteúdo" },
  { value: "design", label: "Ajuste de design" },
  { value: "funcionalidade", label: "Nova funcionalidade" },
  { value: "correcao", label: "Correção de erro" },
  { value: "outro", label: "Outro" },
];

/** Diálogo para o cliente abrir uma nova solicitação de alteração no site. */
export const NewRequestDialog = ({ open, onOpenChange, clientId, siteId, userId, onCreated }: Props) => {
  const [type, setType] = useState("conteudo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setType("conteudo");
    setTitle("");
    setDescription("");
    setLoading(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Preencha os campos",
        description: "Informe um título e a descrição da solicitação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("site_requests").insert({
        client_id: clientId,
        site_id: siteId,
        user_id: userId,
        type,
        title: title.trim(),
        description: description.trim(),
        status: "open",
      });
      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Nossa equipe vai analisar e responder em breve.",
      });
      onCreated?.();
      handleClose(false);
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:w-full">
        <DialogHeader>
          <DialogTitle>Nova solicitação</DialogTitle>
          <DialogDescription>Descreva a alteração que você deseja no seu site.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="req-type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="req-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-title">Título</Label>
            <Input
              id="req-title"
              placeholder="Ex.: Atualizar telefone de contato"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-desc">Descrição</Label>
            <Textarea
              id="req-desc"
              placeholder="Explique com detalhes o que precisa ser alterado."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar solicitação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
