import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Building2, Folder, FolderOpen, MapPin, Phone, Filter, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadFlow — Captação de Leads" },
      { name: "description", content: "Dashboard de captação de leads integrado ao Claude e n8n. Filtre por cidade, estado e segmento e organize os retornos por pastas." },
      { property: "og:title", content: "LeadFlow — Captação de Leads" },
      { property: "og:description", content: "Dashboard de captação de leads integrado ao Claude e n8n." },
    ],
  }),
  component: Dashboard,
});

type Status = "none" | "green" | "amber" | "red";

type Lead = {
  id: string;
  empresa: string;
  telefone: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  segmento: string;
  status: Status;
  nota: string;
};

const SEGMENTOS = [
  "Clínica Médica",
  "Veterinária",
  "Restaurante",
  "Academia",
  "Salão de Beleza",
  "Escritório de Advocacia",
  "Imobiliária",
  "Loja de Roupas",
];

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const MOCK: Lead[] = [
  { id: "1", empresa: "Clínica Vida Plena", telefone: "(11) 98888-1010", endereco: "Av. Paulista, 1200", cep: "01310-100", cidade: "São Paulo", estado: "SP", segmento: "Clínica Médica", status: "green", nota: "Reunião marcada para terça 14h." },
  { id: "2", empresa: "PetCare Premium", telefone: "(11) 97777-2020", endereco: "Rua Augusta, 540", cep: "01304-000", cidade: "São Paulo", estado: "SP", segmento: "Veterinária", status: "amber", nota: "Aguardando retorno do gerente." },
  { id: "3", empresa: "Cantina do Bairro", telefone: "(11) 96666-3030", endereco: "Rua Oscar Freire, 88", cep: "01426-001", cidade: "São Paulo", estado: "SP", segmento: "Restaurante", status: "red", nota: "Sem interesse no momento." },
  { id: "4", empresa: "Sabor Mineiro", telefone: "(11) 95555-4040", endereco: "Av. Brigadeiro, 2200", cep: "01451-000", cidade: "São Paulo", estado: "SP", segmento: "Restaurante", status: "none", nota: "" },
  { id: "5", empresa: "Bem-Estar Animal", telefone: "(21) 94444-5050", endereco: "Av. Atlântica, 500", cep: "22010-000", cidade: "Rio de Janeiro", estado: "RJ", segmento: "Veterinária", status: "amber", nota: "Enviar proposta por e-mail." },
];

function Dashboard() {
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("10");
  const [segmento, setSegmento] = useState<string>("");

  const [leads, setLeads] = useState<Lead[]>(MOCK);
  const [openFolder, setOpenFolder] = useState<string | null>("Clínica Médica");
  const [loading, setLoading] = useState(false);

  function handleSearch() {
    setLoading(true);
    // Simulação — a integração real será feita via n8n / Claude.
    setTimeout(() => setLoading(false), 600);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) {
      if (!map.has(l.segmento)) map.set(l.segmento, []);
      map.get(l.segmento)!.push(l);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [leads]);

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-[0_0_30px_-5px_var(--brand)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">LeadFlow</h1>
              <p className="text-xs text-muted-foreground">Captação de leads · Claude × n8n</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <span className="h-2 w-2 rounded-full bg-status-green" />
            Automação conectada
          </div>
        </header>

        {/* Filtros */}
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros de busca
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_140px_1fr_auto]">
            <Field label="Cidade">
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: São Paulo" />
            </Field>
            <Field label="Estado">
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantidade">
              <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </Field>
            <Field label="Segmento profissional">
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger><SelectValue placeholder="Selecione o segmento" /></SelectTrigger>
                <SelectContent>
                  {SEGMENTOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90 md:w-auto md:px-6">
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </section>

        {/* Legenda */}
        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Legenda de tags:</span>
          <LegendDot color="green" label="Reunião Agendada" />
          <LegendDot color="amber" label="Em Andamento" />
          <LegendDot color="red" label="Recusado ou Sem Resposta" />
        </section>

        {/* Pastas por segmento */}
        <section className="mt-6 space-y-3">
          {grouped.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
              Nenhum resultado ainda. Realize uma busca para popular as pastas.
            </div>
          )}
          {grouped.map(([seg, items]) => {
            const open = openFolder === seg;
            return (
              <div key={seg} className="overflow-hidden rounded-2xl border border-border bg-card/60">
                <button
                  onClick={() => setOpenFolder(open ? null : seg)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3">
                    {open ? <FolderOpen className="h-5 w-5 text-brand" /> : <Folder className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <div className="font-medium">{seg}</div>
                      <div className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "empresa" : "empresas"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusCount items={items} status="green" />
                    <StatusCount items={items} status="amber" />
                    <StatusCount items={items} status="red" />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1100px] border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <Th>Empresa</Th>
                            <Th>Telefone</Th>
                            <Th>Endereço</Th>
                            <Th>CEP</Th>
                            <Th>Cidade</Th>
                            <Th>UF</Th>
                            <Th>Status</Th>
                            <Th className="min-w-[260px]">Observações do atendimento</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((l) => (
                            <tr key={l.id} className="border-t border-border/60 align-top hover:bg-accent/20">
                              <Td>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{l.empresa}</span>
                                </div>
                              </Td>
                              <Td>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />{l.telefone}
                                </div>
                              </Td>
                              <Td>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5" />{l.endereco}
                                </div>
                              </Td>
                              <Td className="text-muted-foreground">{l.cep}</Td>
                              <Td>{l.cidade}</Td>
                              <Td className="text-muted-foreground">{l.estado}</Td>
                              <Td>
                                <StatusSelect value={l.status} onChange={(v) => updateLead(l.id, { status: v })} />
                              </Td>
                              <Td>
                                <Textarea
                                  value={l.nota}
                                  onChange={(e) => updateLead(l.id, { nota: e.target.value })}
                                  placeholder="Anotações sobre o contato..."
                                  className="min-h-[64px] resize-y bg-background/40"
                                />
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function LegendDot({ color, label }: { color: "green" | "amber" | "red"; label: string }) {
  const cls = color === "green" ? "bg-status-green" : color === "amber" ? "bg-status-amber" : "bg-status-red";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span className="text-foreground/80">{label}</span>
    </span>
  );
}

function StatusCount({ items, status }: { items: Lead[]; status: "green" | "amber" | "red" }) {
  const n = items.filter((i) => i.status === status).length;
  if (!n) return null;
  const cls = status === "green" ? "bg-status-green" : status === "amber" ? "bg-status-amber" : "bg-status-red";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/40 px-2 py-1">
      <span className={`h-2 w-2 rounded-full ${cls}`} /> {n}
    </span>
  );
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Status)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Definir tag">
          <StatusLabel value={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none"><StatusLabel value="none" /></SelectItem>
        <SelectItem value="green"><StatusLabel value="green" /></SelectItem>
        <SelectItem value="amber"><StatusLabel value="amber" /></SelectItem>
        <SelectItem value="red"><StatusLabel value="red" /></SelectItem>
      </SelectContent>
    </Select>
  );
}

function StatusLabel({ value }: { value: Status }) {
  const map: Record<Status, { cls: string; text: string }> = {
    none: { cls: "bg-muted-foreground/40", text: "Sem tag" },
    green: { cls: "bg-status-green", text: "Reunião Agendada" },
    amber: { cls: "bg-status-amber", text: "Em Andamento" },
    red: { cls: "bg-status-red", text: "Recusado / Sem Resposta" },
  };
  const { cls, text } = map[value];
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span>{text}</span>
    </span>
  );
}