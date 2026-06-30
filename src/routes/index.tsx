import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Building2, Folder, FolderOpen, MapPin, Phone, Filter, Sparkles, ExternalLink, Globe, Trash2, X } from "lucide-react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadFlow — Captação de Leads" },
      { name: "description", content: "Dashboard de captação de leads integrado ao Claude e n8n." },
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
  bairro: string;
  cidade: string;
  segmento: string;
  site: string;
  googleMaps: string;
  status: Status;
  nota: string;
};

const SEGMENTOS = [
  { label: "Clínicas Odontológicas", value: "clinicas odontologicas" },
  { label: "Clínicas Veterinárias",  value: "veterinaria" },
  { label: "Restaurantes",           value: "restaurantes" },
  { label: "Imobiliárias",           value: "imobiliaria" },
];

const CIDADES = [
  "Recife","São Paulo","Rio de Janeiro","Belo Horizonte","Salvador",
  "Fortaleza","Curitiba","Manaus","Porto Alegre","Belém","Goiânia",
  "Guarulhos","Campinas","Natal","Maceió","João Pessoa","Teresina",
  "Campo Grande","Cuiabá","Aracaju","Porto Velho","Rio Branco",
  "Palmas","Boa Vista","Florianópolis","Vitória","São Luís",
  "Macapá","Ribeirão Preto","Uberlândia","Sorocaba",
  "Feira de Santana","Joinville","Londrina","Osasco","Santo André",
];

function Dashboard() {
  const [cidade, setCidade] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("25");
  const [segmentoValue, setSegmentoValue] = useState<string>("");
  const [bairro, setBairro] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>(() => {
    try { const s = localStorage.getItem("leadflow_leads"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem("leadflow_leads", JSON.stringify(leads)); } catch {}
  }, [leads]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "folder" | "lead"; key: string } | null>(null);

  async function handleSearch() {
    if (!segmentoValue || !cidade || !quantidade) {
      toast.error("Preencha tipo de empresa, cidade e quantidade.");
      return;
    }
    setLoading(true);
    const seg = SEGMENTOS.find((s) => s.value === segmentoValue);
    try {
      const params = new URLSearchParams({ tipo: segmentoValue, cidade, limite: quantidade });
      if (bairro.trim()) params.set("bairro", bairro.trim());
      const url = `https://n8nai.ricardorochaslc.com.br/webhook/captura-leads?${params.toString()}`;
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      const novosLeads: Lead[] = (data.leads || []).map((l: Record<string, string>, i: number) => ({
        id: `${Date.now()}-${i}`,
        empresa: l.nome || "Sem nome",
        telefone: l.telefone || "",
        endereco: l.endereco || "",
        bairro: l.bairro || bairro,
        cidade: l.cidade || cidade,
        segmento: seg?.label || segmentoValue,
        site: l.site || "",
        googleMaps: l.googleMaps || `https://www.google.com/maps/search/${encodeURIComponent((l.nome || "") + " " + cidade)}`,
        status: "none",
        nota: "",
      }));
      if (novosLeads.length === 0) {
        toast.warning("Nenhum lead encontrado. Tente outro bairro ou segmento.");
      } else {
        setLeads((prev) => {
          const existingKeys = new Set(prev.map((l) => l.empresa + l.cidade + l.bairro));
          const unicos = novosLeads.filter((l) => !existingKeys.has(l.empresa + l.cidade + l.bairro));
          return [...unicos, ...prev];
        });
        setOpenFolder(seg?.label || segmentoValue);
        const localLabel = bairro ? `${bairro}, ${cidade}` : cidade;
        toast.success(`${novosLeads.length} leads de "${seg?.label}" em ${localLabel} adicionados!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao buscar leads.");
    } finally {
      setLoading(false);
    }
  }

  function deleteFolder(seg: string) {
    setLeads((prev) => prev.filter((l) => l.segmento !== seg));
    if (openFolder === seg) setOpenFolder(null);
    setConfirmDelete(null);
    toast.success(`Pasta "${seg}" removida.`);
  }

  function deleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) {
      if (!map.has(l.segmento)) map.set(l.segmento, []);
      map.get(l.segmento)!.push(l);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [leads]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Modal de confirmação */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-2 text-base font-semibold">Confirmar exclusão</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {confirmDelete.type === "folder"
                ? `Remover a pasta "${confirmDelete.key}" e todos os leads dentro dela?`
                : "Remover este lead da lista?"}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() =>
                  confirmDelete.type === "folder"
                    ? deleteFolder(confirmDelete.key)
                    : deleteLead(confirmDelete.key)
                }
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-6 py-8">
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

        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros de busca
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_1fr_1fr_auto]">
            <Field label="Cidade">
              <Select value={cidade} onValueChange={setCidade}>
                <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                <SelectContent>
                  {CIDADES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantidade">
              <Input type="number" min={1} max={100} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </Field>
            <Field label="Tipo de empresa">
              <Select value={segmentoValue} onValueChange={setSegmentoValue}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {SEGMENTOS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Bairro (opcional)">
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Boa Viagem" />
            </Field>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90 md:w-auto md:px-6">
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Buscando... (~20s)" : "Buscar"}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Legenda:</span>
          <LegendDot color="green" label="Reunião Agendada" />
          <LegendDot color="amber" label="Em Andamento" />
          <LegendDot color="red" label="Recusado ou Sem Resposta" />
        </section>

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
                <div className="flex w-full items-center gap-2 px-5 py-4">
                  <button
                    onClick={() => setOpenFolder(open ? null : seg)}
                    className="flex flex-1 items-center gap-3 text-left transition-colors hover:opacity-80"
                  >
                    {open ? <FolderOpen className="h-5 w-5 text-brand" /> : <Folder className="h-5 w-5 text-muted-foreground" />}
                    <div>
                      <div className="font-medium">{seg}</div>
                      <div className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "empresa" : "empresas"}</div>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <StatusCount items={items} status="green" />
                    <StatusCount items={items} status="amber" />
                    <StatusCount items={items} status="red" />
                    <button
                      onClick={() => setConfirmDelete({ type: "folder", key: seg })}
                      title="Excluir pasta"
                      className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <Th>Empresa</Th>
                          <Th>Telefone</Th>
                          <Th>Endereço / Bairro</Th>
                          <Th>Links</Th>
                          <Th>Status</Th>
                          <Th className="min-w-[220px]">Observações</Th>
                          <Th className="w-10"></Th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((l) => (
                          <tr key={l.id} className="border-t border-border/60 align-top hover:bg-accent/20">
                            <Td>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="font-medium">{l.empresa}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {[l.bairro, l.cidade].filter(Boolean).join(", ")}
                              </div>
                            </Td>
                            <Td>
                              {l.telefone ? (
                                <a href={`tel:${l.telefone}`} className="flex items-center gap-1.5 hover:underline">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />{l.telefone}
                                </a>
                              ) : (
                                <a href={l.googleMaps} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/20">
                                  <ExternalLink className="h-3 w-3" /> Buscar no Google
                                </a>
                              )}
                            </Td>
                            <Td>
                              <span className="text-muted-foreground">{l.endereco || "—"}</span>
                            </Td>
                            <Td>
                              <div className="flex flex-col gap-1">
                                {l.site && (
                                  <a href={l.site.startsWith("http") ? l.site : `https://${l.site}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                    <Globe className="h-3 w-3" /> Site
                                  </a>
                                )}
                                <a href={l.googleMaps} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                  <MapPin className="h-3 w-3" /> Google Maps
                                </a>
                              </div>
                            </Td>
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
                            <Td>
                              <button
                                onClick={() => setConfirmDelete({ type: "lead", key: l.id })}
                                title="Excluir empresa"
                                className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/20 border border-red-500/30"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
        <SelectValue placeholder="Definir tag"><StatusLabel value={value} /></SelectValue>
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
    none:  { cls: "bg-muted-foreground/40", text: "Sem tag" },
    green: { cls: "bg-status-green",        text: "Reunião Agendada" },
    amber: { cls: "bg-status-amber",        text: "Em Andamento" },
    red:   { cls: "bg-status-red",          text: "Recusado / Sem Resposta" },
  };
  const { cls, text } = map[value];
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span>{text}</span>
    </span>
  );
}