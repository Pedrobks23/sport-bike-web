import jsPDF from "jspdf"

export default function generateWorkshopTagsPDF(ordem) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    // Layout constants
    const margin = 5
    const colGap = 4
    const rowGap = 4
    const tagW = (210 - 2 * margin - colGap) / 2  // 98 mm
    const tagH = (297 - 2 * margin - rowGap) / 2  // 141.5 mm
    const pad = 4
    const innerW = tagW - pad * 2

    // Day names
    const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

    const formatarData = (data) => {
      const date = new Date(data)
      const dd = String(date.getDate()).padStart(2, "0")
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const yyyy = date.getFullYear()
      return `${dd}/${mm}/${yyyy} ${diasSemana[date.getDay()]}`
    }

    const formatCurrency = (v) =>
      Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

    // Truncate text to fit maxW (mm) using current font settings
    const truncate = (text, maxW) => {
      if (doc.getTextWidth(text) <= maxW) return text
      let t = text
      while (t.length > 0 && doc.getTextWidth(t + "…") > maxW) {
        t = t.slice(0, -1)
      }
      return t + "…"
    }

    const calcSubtotal = (bike) => {
      let total = 0
      if (bike.services) {
        Object.entries(bike.services).forEach(([name, qty]) => {
          if (qty > 0) {
            const val =
              bike.serviceValues?.[name]?.valorFinal ??
              bike.serviceValues?.[name]?.valor ??
              0
            total += Number(val) * Number(qty)
          }
        })
      }
      if (bike.pecas?.length > 0) {
        bike.pecas.forEach((peca) => {
          total += (parseFloat(peca.valor) || 0) * (parseInt(peca.quantidade) || 1)
        })
      }
      return total
    }

    const getTagPos = (index) => {
      const slot = index % 4
      const col = slot % 2
      const row = Math.floor(slot / 2)
      return {
        x: margin + col * (tagW + colGap),
        y: margin + row * (tagH + rowGap),
      }
    }

    const bicicletas = ordem.bicicletas || []

    const drawTag = (bike, bikeIndex) => {
      const { x, y } = getTagPos(bikeIndex)

      // Dashed border for cutting guide
      doc.setLineDashPattern([2, 2], 0)
      doc.setLineWidth(0.3)
      doc.setDrawColor(100, 100, 100)
      doc.rect(x, y, tagW, tagH)
      doc.setLineDashPattern([], 0)
      doc.setDrawColor(0, 0, 0)
      doc.setTextColor(0, 0, 0)

      let curY = y + pad + 6

      // 1. OS code + bike number — Bold 16pt
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(`${ordem.codigo} | BIKE ${bikeIndex + 1}`, x + pad, curY)
      curY += 7

      // 2. Scheduling date — normal 11pt
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      doc.text(formatarData(ordem.dataAgendamento), x + pad, curY)
      curY += 6

      // 3. Client name — Bold 13pt uppercase
      doc.setFont("helvetica", "bold")
      doc.setFontSize(13)
      const nomeCliente = (ordem.cliente?.nome || "-").toUpperCase()
      doc.text(truncate(nomeCliente, innerW), x + pad, curY)
      curY += 6

      // 4. Phone — normal 11pt
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      doc.text(`Tel: ${ordem.cliente?.telefone || "-"}`, x + pad, curY)
      curY += 6

      // 5. Bike model — Bold 14pt uppercase
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      const bikeText = `${bike.marca || ""} ${bike.modelo || ""} ${bike.cor || ""}`.trim().toUpperCase()
      doc.text(truncate(bikeText, innerW), x + pad, curY)
      curY += 7

      // 6. Separator line
      doc.setLineWidth(0.3)
      doc.line(x + pad, curY, x + tagW - pad, curY)
      curY += 5

      // Bottom limit: reserve 28 mm for bike cross-reference + footer
      const bottomLimit = y + tagH - 28

      // 7. Services — title Bold 10pt, items normal 10pt
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("SERVIÇOS:", x + pad, curY)
      curY += 5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      let hasServices = false
      let overflowed = false
      if (bike.services) {
        for (const [serviceName, quantity] of Object.entries(bike.services)) {
          if (quantity > 0) {
            hasServices = true
            if (curY > bottomLimit) {
              doc.text("...", x + pad, curY)
              curY += 5
              overflowed = true
              break
            }
            const val =
              bike.serviceValues?.[serviceName]?.valorFinal ??
              bike.serviceValues?.[serviceName]?.valor ??
              0
            const subtotal = Number(val) * Number(quantity)
            const line = `• ${serviceName} (${quantity}x) = ${formatCurrency(subtotal)}`
            doc.text(truncate(line, innerW), x + pad, curY)
            curY += 5
          }
        }
      }
      if (!hasServices) {
        doc.text("Nenhum serviço.", x + pad, curY)
        curY += 5
      }

      // 8. Parts — title Bold 10pt, items normal 10pt
      if (!overflowed) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("PEÇAS:", x + pad, curY)
        curY += 5

        doc.setFont("helvetica", "normal")
        doc.setFontSize(10)
        if (bike.pecas && bike.pecas.length > 0) {
          for (const peca of bike.pecas) {
            if (curY > bottomLimit) {
              doc.text("...", x + pad, curY)
              curY += 5
              break
            }
            const qty = parseInt(peca.quantidade) || 1
            const val = parseFloat(peca.valor) || 0
            const subtotal = val * qty
            const line = `• ${peca.nome} (${qty}x) = ${formatCurrency(subtotal)}`
            doc.text(truncate(line, innerW), x + pad, curY)
            curY += 5
          }
        } else {
          doc.text("Nenhuma peça.", x + pad, curY)
          curY += 5
        }
      }

      // 9. Subtotal — Bold 12pt
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(`SUBTOTAL: ${formatCurrency(calcSubtotal(bike))}`, x + pad, curY)
      curY += 7

      // 10. Cross-reference list (only when more than 1 bike)
      if (bicicletas.length > 1) {
        doc.setLineWidth(0.2)
        doc.line(x + pad, curY, x + tagW - pad, curY)
        curY += 4

        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.text(`BIKES DO CLIENTE (${bicicletas.length}):`, x + pad, curY)
        curY += 4

        const listLimit = y + tagH - 10
        for (let i = 0; i < bicicletas.length; i++) {
          if (curY > listLimit) break
          const b = bicicletas[i]
          const bikeDesc = `${b.marca || ""} ${b.modelo || ""} ${b.cor || ""}`.trim()
          if (i === bikeIndex) {
            doc.setFont("helvetica", "bold")
            doc.setFontSize(8)
            doc.text(truncate(`► Bike ${i + 1}: ${bikeDesc}`, innerW), x + pad, curY)
          } else {
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8)
            doc.text(truncate(`• Bike ${i + 1}: ${bikeDesc}`, innerW), x + pad, curY)
          }
          curY += 3.5
        }
      }

      // 11. Footer — normal 6pt, fixed text
      doc.setFont("helvetica", "normal")
      doc.setFontSize(6)
      doc.setTextColor(0, 0, 0)
      doc.text(
        "✂ CORTE NAS LINHAS TRACEJADAS E PENDURE COM FITA DUREX NO CÂMBIO",
        x + pad,
        y + tagH - pad,
      )
    }

    bicicletas.forEach((bike, index) => {
      if (index > 0 && index % 4 === 0) {
        doc.addPage()
      }
      drawTag(bike, index)
    })

    doc.save(`OS-Tags-Oficina-${ordem.codigo}.pdf`)
  } catch (err) {
    console.error("Erro ao gerar PDF das tags:", err)
    alert("Erro ao gerar PDF das tags. Tente novamente.")
  }
}
