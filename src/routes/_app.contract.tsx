import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, type SavedContract } from "@/lib/store";
import { formatDA, formatDate } from "@/lib/format";
import { Th, Td } from "./_components/table";
import { Printer, Trash2, Eye, FileText, Search } from "lucide-react";
import { Modal, EmptyState } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/contract")({
  component: ContractPage,
});

function ContractPage() {
  const savedContracts = useStore((s) => s.savedContracts);
  const loadSavedContracts = useStore((s) => s.loadSavedContracts);
  const deleteSavedContract = useStore((s) => s.deleteSavedContract);
  const isAdmin = useStore((s) => s.auth.role === "admin");

  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);
  const [contractSearch, setContractSearch] = useState("");

  useEffect(() => {
    loadSavedContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Contrats Sauvegardés</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
        <input
          className="input-field w-full pl-9"
          placeholder="Rechercher par client, article..."
          value={contractSearch}
          onChange={(e) => setContractSearch(e.target.value)}
        />
      </div>

      {(() => {
        const q = contractSearch.trim().toLowerCase();
        const visible = q
          ? savedContracts.filter((c) => {
              const hay = `${c.clientName} ${c.clientPhone} ${c.articles.map((a) => a.name).join(", ")}`.toLowerCase();
              return hay.includes(q);
            })
          : savedContracts;

        if (visible.length === 0) {
          return (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title={q ? "Aucun résultat" : "Aucun contrat sauvegardé"}
            />
          );
        }

        return (
          <div className="card-surface" style={{ padding: 0, overflow: "hidden" }}>
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                  <Th>Date Sauvegarde</Th>
                  <Th>Client</Th>
                  <Th>Articles</Th>
                  <Th>Total</Th>
                  <Th>Reste</Th>
                  <Th style={{ textAlign: "right" }}>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <Td>{formatDate(c.savedAt)}</Td>
                    <Td>
                      <div>{c.clientName}</div>
                      <div className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>{c.clientPhone}</div>
                    </Td>
                    <Td>{c.articles.map((a) => a.name).join(", ")}</Td>
                    <Td>{formatDA(c.total)}</Td>
                    <Td style={{ color: c.reste > 0 ? "#74367E" : "rgba(26,26,26,0.45)", fontWeight: c.reste > 0 ? 500 : 400 }}>{formatDA(c.reste)}</Td>
                    <Td style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedContract(c)}
                          className="btn-ghost"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                          title="Voir / Imprimer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm("Voulez-vous supprimer ce contrat sauvegardé ?")) {
                                deleteSavedContract(c.id);
                                toast.success("Contrat supprimé !");
                              }
                            }}
                            className="btn-danger cursor-pointer"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y" style={{ borderColor: "#E5E5E5" }}>
              {visible.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{c.clientName}</div>
                      <div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>{c.clientPhone}</div>
                    </div>
                    <div className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>{formatDate(c.savedAt)}</div>
                  </div>
                  <div className="text-xs text-neutral-600 truncate">{c.articles.map((a) => a.name).join(", ")}</div>
                  <div className="flex justify-between items-center text-sm pt-1">
                    <div>Total: {formatDA(c.total)}</div>
                    {c.reste > 0 && <div style={{ color: "#74367E", fontWeight: 500 }}>Reste: {formatDA(c.reste)}</div>}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setSelectedContract(c)} className="btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }}>
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm("Supprimer ce contrat ?")) {
                            deleteSavedContract(c.id);
                            toast.success("Contrat supprimé !");
                          }
                        }}
                        className="btn-danger cursor-pointer"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {selectedContract && (
        <Modal
          open={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={`Détail Contrat · ${selectedContract.clientName}`}
          size="md"
          footer={
            <div className="flex justify-between w-full">
              <button onClick={() => window.print()} className="btn-primary flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button onClick={() => setSelectedContract(null)} className="btn-danger">
                Fermer
              </button>
            </div>
          }
        >
          <div className="py-2">
            <div className="border rounded-lg p-4 space-y-3 bg-[#FAFAFA]" style={{ borderColor: "#E5E5E5" }}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-neutral-600">Client :</span>
                <span>{selectedContract.clientName} ({selectedContract.clientPhone})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-neutral-600">Date Retrait :</span>
                <span>{formatDate(selectedContract.pickupDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-neutral-600">Date Retour :</span>
                <span>{formatDate(selectedContract.returnDate)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <span className="font-semibold text-sm text-neutral-600">Articles :</span>
                <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                  {selectedContract.articles.map((a, idx) => (
                    <li key={idx}>
                      {a.name} - <span style={{ color: "#74367E" }}>{formatDA(a.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total :</span>
                  <strong>{formatDA(selectedContract.total)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Versé :</span>
                  <span>{formatDA(selectedContract.verse)}</span>
                </div>
                <div className="flex justify-between" style={{ color: "#74367E" }}>
                  <span>Reste à payer :</span>
                  <strong>{formatDA(selectedContract.reste)}</strong>
                </div>
                {selectedContract.caution > 0 && (
                  <div className="flex justify-between">
                    <span>Caution :</span>
                    <strong>{formatDA(selectedContract.caution)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden Print block, displayed via @media print stylesheet */}
      {selectedContract && (
        <div className="print-area" style={{ display: "none" }}>
          <PrintSavedContract contract={selectedContract} />
        </div>
      )}
      <style>{`@media print { .print-area { display: block !important; } }`}</style>
    </div>
  );
}

function PrintSavedContract({ contract }: { contract: SavedContract }) {
  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", color: "#1A1A1A", fontSize: 13, lineHeight: 1.4, height: "100%", position: "relative", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "2px solid #74367E" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 26, color: "#74367E", letterSpacing: "0.15em" }}>
          Boutique des Rêves
        </div>
        <div style={{ fontSize: 11, marginTop: 2, color: "rgba(26,26,26,0.6)" }}>Contrat de location</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Client :</strong> {contract.clientName}<br />
        <strong>Téléphone :</strong> {contract.clientPhone}<br />
      </div>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Article</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }}>Prix</th>
          </tr>
        </thead>
        <tbody>
          {contract.articles.map((a, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #E5E5E5" }}>
              <td style={{ padding: "6px 8px" }}>{a.name}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatDA(a.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <div>Retrait : {formatDate(contract.pickupDate)}</div>
        <div>Retour prévu : {formatDate(contract.returnDate)}</div>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #E5E5E5", borderRadius: 8, textAlign: "center" }}>
        <div>Total : <strong>{formatDA(contract.total)}</strong></div>
        <div>Versé : {formatDA(contract.verse)}</div>
        <div>Reste : <strong style={{ color: "#74367E" }}>{formatDA(contract.reste)}</strong></div>
        {contract.caution > 0 && <div>Caution : <strong>{formatDA(contract.caution)}</strong></div>}
      </div>

      <div style={{ marginTop: 32 }}>
        Signature client : _________________________   Date : ___/___/______
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 10, textAlign: "center", color: "rgba(26,26,26,0.55)", lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Les versements effectués ne sont pas remboursables. · Pièce d'identité obligatoire.</span>
          <span style={{ color: "rgba(26,26,26,0.3)" }}>|</span>
          <span dir="rtl">المبالغ المدفوعة غير قابلة للاسترداد. · بطاقة الهوية إجبارية.</span>
        </div>
        <div style={{ marginTop: 8, borderTop: "1px solid #E5E5E5", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
            <strong style={{ fontWeight: 600 }}>boutique_des_reves_</strong>
          </span>
          <span style={{ color: "rgba(26,26,26,0.3)" }}>·</span>
          <span>Contact : 0774 22 39 50</span>
        </div>
      </div>
    </div>
  );
}