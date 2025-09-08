/* eslint-disable */
import jsPDF from "jspdf"

async function generateWorkshopTagsPDF(ordem) {
  try {
    const docPDF = new jsPDF()
    const pageWidth = docPDF.internal.pageSize.getWidth()
    const pageHeight = docPDF.internal.pageSize.getHeight()

    const tagWidth = 100
    const tagHeight = 90
    const cols = 2
    const marginX = (pageWidth - cols * tagWidth) / (cols + 1)
    const marginY = 20
    const gapY = 15

    const normalizeText = (t) => (t || "").replace(/([,/])(\S)/g, "$1 $2")

    const formatarData = (data) => {
      const date = new Date(data)
      const diasSemana = [
        "DOMINGO",
        "SEGUNDA",
        "TERÇA",
        "QUARTA",
        "QUINTA",
        "SEXTA",
        "SÁBADO",
      ]
      return `${date.toLocaleDateString("pt-BR")} ${diasSemana[date.getDay()]}`
    }

    const calcularSubtotalBike = (bike) => {
      let subtotal = 0
      if (bike.services) {
        Object.entries(bike.services).forEach(([serviceName, quantity]) => {
          if (quantity > 0) {
            const serviceValue =
              bike.serviceValues?.[serviceName]?.valorFinal ||
              bike.serviceValues?.[serviceName]?.valor ||
              0
            subtotal += serviceValue * quantity
          }
        })
      }
      if (bike.pecas) {
        bike.pecas.forEach((peca) => {
          const qty = parseInt(peca.quantidade) || 1
          subtotal += (Number.parseFloat(peca.valor) || 0) * qty
        })
      }
      return subtotal
    }

    let currentPage = 0
    const tagsPerPage = 3

    ordem.bicicletas?.forEach((bike, index) => {
      const tagIndex = index % tagsPerPage

      if (index > 0 && index % tagsPerPage === 0) {
        docPDF.addPage()
        currentPage++
      }

      const col = tagIndex % cols
      const row = Math.floor(tagIndex / cols)

      const x = marginX + col * (tagWidth + marginX)
      const y = marginY + row * (tagHeight + gapY)

      docPDF.setLineDashPattern([3, 3], 0)
      docPDF.setLineWidth(1.5)
      docPDF.rect(x, y, tagWidth, tagHeight)

      let yPos = y + 12

      docPDF.setLineDashPattern([], 0)
      docPDF.setFontSize(16)
      docPDF.setFont("helvetica", "bold")
      docPDF.text(`${ordem.codigo} | BIKE ${index + 1}`, x + tagWidth / 2, yPos, { align: "center" })
      yPos += 8

      docPDF.setFontSize(11)
      docPDF.text(formatarData(ordem.dataAgendamento), x + tagWidth / 2, yPos, { align: "center" })
      yPos += 7

      docPDF.line(x + 5, yPos, x + tagWidth - 5, yPos)
      yPos += 5

      docPDF.setFontSize(10)
      const nomeCliente = normalizeText(ordem.cliente?.nome || "-")
      const nomeLines = docPDF.splitTextToSize(nomeCliente, tagWidth - 10)
      docPDF.text(nomeLines, x + 5, yPos)
      yPos += nomeLines.length * 4 + 3

      docPDF.text(`Tel: ${ordem.cliente?.telefone || "-"}`, x + 5, yPos)
      yPos += 6

      docPDF.setFontSize(14)
      docPDF.setFont("helvetica", "bold")
      docPDF.rect(x + 5, yPos - 3, tagWidth - 10, 7)
      const bikeText = normalizeText(`${bike.marca} ${bike.modelo} ${bike.cor}`.trim())
      const bikeLines = docPDF.splitTextToSize(bikeText, tagWidth - 12)
      docPDF.text(bikeLines, x + tagWidth / 2, yPos, { align: "center" })
      yPos += Math.max(bikeLines.length * 5, 7) + 4

      docPDF.setFontSize(12)
      docPDF.setFont("helvetica", "bold")
      docPDF.text("SERVIÇOS:", x + 5, yPos)
      yPos += 5

      docPDF.setFontSize(10)
      docPDF.setFont("helvetica", "bold")
      if (bike.services) {
        Object.entries(bike.services).forEach(([serviceName, quantity]) => {
          if (quantity > 0) {
            const serviceValue =
              bike.serviceValues?.[serviceName]?.valorFinal ||
              bike.serviceValues?.[serviceName]?.valor ||
              0
            const subtotal = serviceValue * quantity
            const serviceLabel = normalizeText(serviceName)
            docPDF.text(`• ${serviceLabel} (${quantity}x) = R$ ${subtotal.toFixed(2)}`, x + 5, yPos)
            yPos += 4
          }
        })
      }
      yPos += 3

      docPDF.setFontSize(12)
      docPDF.setFont("helvetica", "bold")
      docPDF.text("PEÇAS:", x + 5, yPos)
      yPos += 5

      docPDF.setFontSize(10)
      docPDF.setFont("helvetica", "bold")
      if (bike.pecas && bike.pecas.length > 0) {
        bike.pecas.forEach((peca) => {
          const qty = parseInt(peca.quantidade) || 1
          const valorPeca = Number.parseFloat(peca.valor) || 0
          const subtotal = valorPeca * qty
          const partName = normalizeText(peca.nome)
          docPDF.text(`• ${partName} (${qty}x) = R$ ${subtotal.toFixed(2)}`, x + 5, yPos)
          yPos += 4
        })
      } else {
        docPDF.text("Nenhuma peça.", x + 5, yPos)
      }

      const subtotal = calcularSubtotalBike(bike)
      docPDF.setFontSize(14)
      docPDF.setFont("helvetica", "bold")
      docPDF.setFillColor(220, 220, 220)
      docPDF.rect(x + 5, y + tagHeight - 12, tagWidth - 10, 8, "F")
      docPDF.rect(x + 5, y + tagHeight - 12, tagWidth - 10, 8)
      docPDF.text(`SUBTOTAL: R$ ${subtotal.toFixed(2)}`, x + tagWidth / 2, y + tagHeight - 7, { align: "center" })
    })

    docPDF.setFontSize(10)
    docPDF.setFont("helvetica", "bold")
    docPDF.text(
      "✂️ CORTE NAS LINHAS TRACEJADAS E PENDURE COM FITA DUREX NO CABO DA BICICLETA",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )

    docPDF.save(`OS-Tags-Oficina-${ordem.codigo}.pdf`)
  } catch (err) {
    console.error("Erro ao gerar PDF das tags:", err)
    alert("Erro ao gerar PDF das tags. Tente novamente.")
  }
}

export default generateWorkshopTagsPDF