import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Loader2, ShieldCheck, QrCode, CreditCard, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { tokenizeCard, isMercadoPagoConfigured, getDeviceId, preloadMercadoPago } from "@/lib/mercadopago";

export type CheckoutPlan = {
  id: string;
  name: string;
  price_cents: number;
  features: string[];
  max_installments: number;
  description?: string;
  is_popular?: boolean;
};

type Props = {
  plan: CheckoutPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PixData = { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string };

export const CheckoutDialog = ({ plan, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);

  // Dados do pagador / cartão
  const [cpf, setCpf] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Endereço de contratação (enviado ao Mercado Pago em additional_info).
  // Rua, bairro, cidade e UF são preenchidos automaticamente pelo CEP (ViaCEP).
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  // Pré-carrega o SDK V2 e o script de segurança ao abrir o diálogo, para que o
  // Device ID (antifraude) já esteja coletado no momento do pagamento.
  useEffect(() => {
    if (open && isMercadoPagoConfigured()) {
      void preloadMercadoPago();
    }
  }, [open]);

  // Ao abrir, pré-preenche CPF e endereço com os dados já salvos no perfil.
  useEffect(() => {
    if (!open || !user) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cpf, address_city, address_state, address_zip_code")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        if (data.cpf) setCpf((prev) => prev || data.cpf!);
        if (data.address_city) setCity((prev) => prev || data.address_city!);
        if (data.address_state) setUf((prev) => prev || data.address_state!);
        if (data.address_zip_code) setZipCode((prev) => prev || data.address_zip_code!);
      }
    })();
  }, [open, user]);

  // Aplica máscara 00000-000 enquanto o usuário digita o CEP.
  const handleZipChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setZipCode(masked);
    setCepError("");
    if (digits.length === 8) void lookupCep(digits);
  };

  // Consulta o ViaCEP e preenche rua, bairro, cidade e UF automaticamente.
  const lookupCep = async (digits: string) => {
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepError("CEP não encontrado. Verifique e tente novamente.");
        return;
      }
      setStreet(data.logradouro ?? "");
      setNeighborhood(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setUf((data.uf ?? "").toUpperCase());
    } catch {
      setCepError("Não foi possível buscar o CEP. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  if (!plan) return null;

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const total = plan.price_cents;

  const resetState = () => {
    setPix(null);
    setLoading(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetState();
    onOpenChange(o);
  };

  const copyPix = async () => {
    if (pix?.qrCode) {
      await navigator.clipboard.writeText(pix.qrCode);
      toast({ title: "Código PIX copiado!" });
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      onOpenChange(false);
      navigate(`/auth?plan=${plan.id}`);
      return;
    }

    if (!cpf.trim()) {
      toast({ title: "Informe seu CPF", description: "Necessário para emitir a cobrança.", variant: "destructive" });
      return;
    }

    if (!city.trim() || !uf.trim() || !zipCode.trim()) {
      toast({
        title: "Informe seu endereço",
        description: "Cidade, estado (UF) e CEP são necessários para concluir a contratação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Normaliza os campos de endereço
      const cityValue = city.trim();
      const ufValue = uf.trim().toUpperCase().slice(0, 2);
      const zipValue = zipCode.replace(/\D/g, "");

      // Salva CPF e endereço no perfil (reutilizados em contratações futuras)
      await supabase
        .from("profiles")
        .update({
          cpf,
          address_city: cityValue,
          address_state: ufValue,
          address_zip_code: zipValue,
        })
        .eq("id", user.id);

      // Monta o payload do pagador
      const [firstName, ...rest] = (user.user_metadata?.full_name ?? user.email ?? "Cliente").split(" ");
      const payer = {
        email: user.email,
        firstName,
        lastName: rest.join(" ") || "TechDev",
        identification: { type: "CPF", number: cpf.replace(/\D/g, "") },
      };

      let cardPayload: Record<string, unknown> | undefined;

      if (method === "card") {
        if (!isMercadoPagoConfigured()) {
          throw new Error("Pagamento por cartão indisponível: chave pública não configurada.");
        }
        const [mm, yy] = cardExpiry.split("/").map((s) => s.trim());
        if (!cardNumber || !cardName || !mm || !yy || !cardCvv) {
          throw new Error("Preencha todos os dados do cartão.");
        }
        const { token, paymentMethodId } = await tokenizeCard({
          cardNumber,
          cardholderName: cardName,
          expirationMonth: mm,
          expirationYear: yy.length === 2 ? `20${yy}` : yy,
          securityCode: cardCvv,
          identificationNumber: cpf,
        });
        cardPayload = { token, paymentMethodId, installments: 1 };
      }

      // Device ID gerado pelo MercadoPago.js V2 (antifraude). Pode ser undefined
      // se o SDK ainda não tiver coletado; nesse caso o backend simplesmente não
      // envia o header X-meli-session-id.
      const deviceId = await getDeviceId();

      // Chama o backend (Vercel Function) para criar a Order
      const res = await fetch("/api/mercadopago/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          method,
          payer,
          card: cardPayload,
          deviceId,
          address: { city: cityValue, state: ufValue, zipCode: zipValue },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Em desenvolvimento, mostra a mensagem real da API e loga o diagnóstico completo.
        if (import.meta.env.DEV) {
          console.log("[v0] Erro do backend ao criar Order:", err);
          const detail = err?.detail ?? err?.error ?? "Falha ao processar o pagamento.";
          const status = err?.debug?.httpStatus ? ` (HTTP ${err.debug.httpStatus})` : "";
          throw new Error(`${detail}${status}`);
        }
        throw new Error(err?.error ?? "Falha ao processar o pagamento.");
      }

      const data = await res.json();

      if (method === "pix" && data.pix) {
        setPix(data.pix);
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código para pagar." });
      } else {
        toast({
          title: "Pagamento enviado!",
          description: "Acompanhe o status da sua assinatura no painel.",
        });
        handleClose(false);
        navigate("/dashboard");
      }
    } catch (e: any) {
      toast({ title: "Erro no pagamento", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
          <DialogTitle>Assinar {plan.name}</DialogTitle>
          <DialogDescription>Pague com PIX ou cartão de crédito de forma segura.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
        {pix ? (
          /* ---- Tela do PIX gerado ---- */
          <div className="space-y-4 text-center">
            {pix.qrCodeBase64 && (
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Code PIX para pagamento"
                className="mx-auto h-56 w-56 rounded-lg border border-border bg-card p-2"
              />
            )}
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code no app do seu banco ou copie o código abaixo.
            </p>
            {pix.qrCode && (
              <div className="flex items-center gap-2">
                <Input readOnly value={pix.qrCode} className="text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copyPix} aria-label="Copiar código PIX">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button variant="hero" className="w-full" onClick={() => { handleClose(false); navigate("/dashboard"); }}>
              Já paguei, ir para o painel
            </Button>
          </div>
        ) : (
          /* ---- Formulário de checkout ---- */
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-2xl font-bold text-primary">{fmt(total)}</span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as "pix" | "card")} className="grid grid-cols-2 gap-2">
                <Label
                  htmlFor="pix"
                  className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer font-normal ${method === "pix" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <QrCode className="h-4 w-4" /> PIX
                </Label>
                <Label
                  htmlFor="card"
                  className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer font-normal ${method === "card" ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-4 w-4" /> Cartão
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="zip">CEP</Label>
                <div className="relative">
                  <Input
                    id="zip"
                    placeholder="00000-000"
                    inputMode="numeric"
                    value={zipCode}
                    onChange={(e) => handleZipChange(e.target.value)}
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {cepError ? (
                  <p className="text-xs text-destructive">{cepError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Informe o CEP para preenchermos o endereço automaticamente.
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" placeholder="Preenchido pelo CEP" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" placeholder="123" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" placeholder="Preenchido pelo CEP" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" placeholder="Preenchido pelo CEP" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">Estado (UF)</Label>
                <Input id="uf" placeholder="UF" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} />
              </div>
            </div>

            {method === "card" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do cartão</Label>
                  <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nome impresso no cartão</Label>
                  <Input id="cardName" placeholder="NOME COMPLETO" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Validade (MM/AA)</Label>
                    <Input id="cardExpiry" placeholder="12/28" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV</Label>
                    <Input id="cardCvv" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-md p-3">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>
                Pagamento processado com segurança pelo Mercado Pago. Os dados do seu cartão são
                tokenizados no navegador e nunca passam pelos nossos servidores.
              </span>
            </div>
          </div>
        )}
        </div>

        {!pix && (
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={() => handleClose(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? `Pagar ${fmt(total)}` : "Entrar para assinar"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
