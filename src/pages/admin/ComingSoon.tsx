import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";

const ComingSoon = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <PageHeader title={title} description="Este módulo está sendo construído nas próximas etapas." />
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <p className="text-lg font-semibold">Em breve</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          A interface de <span className="font-medium text-foreground">{title}</span> será entregue na próxima
          etapa do Painel CEO.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default ComingSoon;
