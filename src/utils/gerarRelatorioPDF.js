import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatarData(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function gerarRelatorioPDF(dados) {
  const { geradoEm, instituicoes, cuidadores, idosos } = dados;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const verde      = [13, 158, 138];
  const cinzaClaro = [245, 247, 250];
  const preto      = [26, 35, 50];
  const cinzaTexto = [100, 110, 120];

  // ── Cabeçalho ─────────────────────────────────────────────────
  doc.setFillColor(...verde);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BomCuidado", 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório Geral do Sistema", 14, 20);
  doc.text(`Gerado em: ${formatarData(geradoEm)}`, 196, 20, { align: "right" });

  let y = 38;

  // ── Resumo Geral ───────────────────────────────────────────────
  doc.setTextColor(...preto);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["", "Total", "Ativos", "Inativos"]],
    body: [
      ["Instituições", instituicoes.total, instituicoes.ativas,  instituicoes.inativas],
      ["Cuidadores",   cuidadores.total,   cuidadores.ativos,    cuidadores.inativos],
      ["Idosos",       idosos.total,       idosos.ativos,        idosos.inativos],
    ],
    theme: "grid",
    headStyles:          { fillColor: verde, textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles:          { fontSize: 9, textColor: preto },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "center", cellWidth: 30 },
      3: { halign: "center", cellWidth: 30 },
    },
    alternateRowStyles: { fillColor: cinzaClaro },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Instituições ───────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...preto);
  doc.text("Instituições", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Nome", "CNPJ", "Email", "UF", "Status"]],
    body: (instituicoes.lista || []).map((inst, i) => [
      i + 1,
      inst.nome  || "—",
      inst.cnpj  || "—",
      inst.email || "—",
      inst.uf    || "—",
      inst.status || "—",
    ]),
    theme: "striped",
    headStyles:          { fillColor: verde, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles:          { fontSize: 8, textColor: preto },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: { fillColor: cinzaClaro },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Cuidadores ────────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...preto);
  doc.text("Cuidadores", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Nome", "Email", "CPF", "Instituição", "Status"]],
    body: (cuidadores.lista || []).map((c, i) => [
      i + 1,
      c.nome            || "—",
      c.email           || "—",
      c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—",
      c.instituicaoNome || "—",
      c.status          || "—",
    ]),
    theme: "striped",
    headStyles:          { fillColor: verde, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles:          { fontSize: 8, textColor: preto },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      5: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: { fillColor: cinzaClaro },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Idosos ────────────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...preto);
  doc.text("Idosos", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Nome", "CPF", "Status"]],
    body: (idosos.lista || []).map((id, i) => [
      i + 1,
      id.nome  || "—",
      id.cpf ? id.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—",
      id.status || "—",
    ]),
    theme: "striped",
    headStyles:          { fillColor: verde, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles:          { fontSize: 8, textColor: preto },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      3: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: { fillColor: cinzaClaro },
    margin: { left: 14, right: 14 },
  });

  // ── Rodapé em todas as páginas ────────────────────────────────
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...cinzaTexto);
    doc.setFont("helvetica", "normal");
    doc.text(
      `BomCuidado — Relatório Geral do Sistema — ${formatarData(geradoEm)}`,
      14, 290
    );
    doc.text(`Página ${i} de ${totalPaginas}`, 196, 290, { align: "right" });
  }

  const nomeArquivo = `relatorio-bomcuidado-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}