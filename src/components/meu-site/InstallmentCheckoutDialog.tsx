import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, QrCode, CreditCard, Copy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { tokenizeCard, isMercadoPagoConfigured, getDeviceId, preloadMercadoPago } from "@/lib/mercadopago";
import { apiFetch } from "@/lib/api-client";

export type ChargeToPay = {
  id: string;
  description: string;
  amount_cents: number;
};

type Props = {
  charge: ChargeToPay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após o pagamento ser confirmado/enviado, para recarregar dados. */
  onPaid?: () => void;
};

type PixData = { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string };

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Diálogo de pagamento de uma cobrança avulsa (site_installments) via Mercado
 * Pago. Suporta PIX (padrão) e cartão de crédito à vista. O valor é sempre
 * recalculado no servidor a partir do registro da cobrança.
 */
export const InstallmentCheckoutDialog = ({ charge, open, onOpenChange, onPaid }: Props) => {
  const { user } = useAuth();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);

  const [cpf, setCpf] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Pré-carrega o SDK e coleta o Device ID ao abrir.
  useEffect(() => {
    if (open && isMercadoPagoConfigured()) void preloadMercadoPago();
  }, [open]);

  // Pré-preenche o CPF a partir do perfil (descriptografado no servidor).
  useEffect(() => {
    if (!open || !user) return;
    void (async () => {
      try {
        const res = await apiFetch("/api/profile/billing", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as { cpf?: string };
        if (data.cpf) setCpf((prev) => prev || data.cpf!);
      } catch {
        /* silencioso */
      }
    })();
  }, [open, user]);

  if (!charge) return null;

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
    if (!user) return;
    if (!cpf.trim()) {
      toast({ title: "Informe seu CPF", description: "Necessário para emitir a cobrança.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
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

      const deviceId = await getDeviceId();

      const res = await apiFetch("/api/mercadopago/pay-installment", {
        method: "POST",
        body: JSON.stringify({
          installmentId: charge.id,
          method,
          payer,
          card: cardPayload,
          deviceId,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          "O pagamento só funciona no site publicado (www.techdev.website), não na pré-visualização.",
        );
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail ?? err?.error ?? "Falha ao processar o pagamento.");
      }

      const data = await res.json();

      if (method === "pix" && data.pix) {
        setPix(data.pix);
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código para pagar." });
      } else {
        // Cartão: confirma o status real antes de fechar.
        let confirmed = false;
        for (let i = 0; i < 4 && !confirmed; i++) {
          try {
            const st = await apiFetch("/api/mercadopago/payment-status", {
              method: "POST",
              body: JSON.stringify({ installmentId: charge.id }),
            });
            const j = await st.json().catch(() => ({}));
            if (j?.paid) confirmed = true;
          } catch {
            /* segue tentando */
          }
          if (!confirmed) await new Promise((r) => setTimeout(r, 1500));
        }
        toast({
          title: confirmed ? "Pagamento aprovado!" : "Pagamento enviado!",
          description: confirmed
            ? "Sua cobrança foi quitada com sucesso."
            : "Estamos confirmando seu pagamento. Acompanhe no histórico.",
        });
        onPaid?.();
        handleClose(false);
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
          <DialogTitle>Pagar cobrança</DialogTitle>
          <DialogDescription>{charge.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {pix ? (
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
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  onPaid?.();
                  handleClose(false);
                }}
              >
                Já paguei, fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{charge.description}</span>
                  <span className="text-2xl font-bold text-primary">{fmtBRL(charge.amount_cents)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <RadioGroup
                  value={method}
                  onValueChange={(v) => setMethod(v as "pix" | "card")}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="inst-pix"
                    className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer font-normal ${method === "pix" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <RadioGroupItem value="pix" id="inst-pix" />
                    <QrCode className="h-4 w-4" /> PIX
                  </Label>
                  <Label
                    htmlFor="inst-card"
                    className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer font-normal ${method === "card" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <RadioGroupItem value="card" id="inst-card" />
                    <CreditCard className="h-4 w-4" /> Cartão
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inst-cpf">CPF</Label>
                <Input id="inst-cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>

              {method === "card" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="inst-cardNumber">Número do cartão</Label>
                    <Input
                      id="inst-cardNumber"
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inst-cardName">Nome impresso no cartão</Label>
                    <Input id="inst-cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="inst-expiry">Validade (MM/AA)</Label>
                      <Input
                        id="inst-expiry"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inst-cvv">CVV</Label>
                      <Input
                        id="inst-cvv"
                        placeholder="000"
                        inputMode="numeric"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button variant="default" className="w-full" onClick={handleConfirm} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processando...
                  </>
                ) : (
                  <>Pagar {fmtBRL(charge.amount_cents)}</>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Pagamento processado com segurança pelo Mercado Pago.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
