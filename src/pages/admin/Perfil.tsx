import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function Perfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const emailLogado = user?.email ?? "ceo@techdev.com";

  const [form, setForm] = useState({
    nome: "Diego Martins",
    email: emailLogado,
    telefone: "(11) 99999-0000",
    cargo: "CEO & Fundador",
    bio: "Fundador da TechDev, responsável pela estratégia e crescimento da empresa.",
  });

  const iniciais = form.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const salvar = () => toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });

  return (
    <div className="space-y-6">
      <PageHeader title="Meu perfil" description="Gerencie suas informações pessoais." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="size-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{iniciais}</AvatarFallback>
            </Avatar>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{form.nome}</h3>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            <Badge variant="outline" className="mt-3 border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="mr-1 size-3" /> {form.cargo}
            </Badge>
            <Button variant="outline" className="mt-6 w-full">Alterar foto</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informações pessoais</CardTitle>
            <CardDescription>Atualize seus dados de contato e biografia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Biografia</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <Button onClick={salvar}>Salvar alterações</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
