import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// PDF 导出功能
export const pdfService = {
  // 导出词汇列表为 PDF
  async exportWordsToPDF(words, options = {}) {
    const {
      title = '词汇列表',
      category = '全部分类',
      pageSize = 'a4',
      orientation = 'portrait'
    } = options

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    })

    // 设置字体（支持中文）
    pdf.setFont('helvetica')
    
    // 添加标题
    pdf.setFontSize(20)
    pdf.text(title, 20, 20)
    
    // 添加分类信息
    pdf.setFontSize(12)
    pdf.text(`分类: ${category}`, 20, 35)
    pdf.text(`生成时间: ${new Date().toLocaleDateString('zh-CN')}`, 20, 45)
    pdf.text(`总计: ${words.length} 个词汇`, 20, 55)

    let yPosition = 70
    const pageHeight = pdf.internal.pageSize.height
    const margin = 20

    words.forEach((word, index) => {
      // 检查是否需要新页面
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 20
      }

      // 1. 英文单词 (加粗，大字体)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}. ${word.word}`, margin, yPosition)
      
      yPosition += 10
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      
      // 2. 音标 (如果有)
      if (word.phonetic || word.pronunciation) {
        const phonetic = word.phonetic || word.pronunciation || ''
        pdf.text(`   音标: ${phonetic}`, margin, yPosition)
        yPosition += 7
      }

      // 3. 单词释义
      const meaningLines = pdf.splitTextToSize(`   释义: ${word.meaning || word.definition || ''}`, 170)
      pdf.text(meaningLines, margin, yPosition)
      yPosition += meaningLines.length * 6 + 2

      // 4. 例句 (如果有)
      if (word.example_sentence || word.example) {
        const example = word.example_sentence || word.example || ''
        const exampleLines = pdf.splitTextToSize(`   例句: ${example}`, 170)
        pdf.text(exampleLines, margin, yPosition)
        yPosition += exampleLines.length * 6 + 2
        
        // 5. 例句释义 (如果有)
        if (word.example_translation || word.sentence_meaning) {
          const translation = word.example_translation || word.sentence_meaning || ''
          const translationLines = pdf.splitTextToSize(`   例句释义: ${translation}`, 170)
          pdf.text(translationLines, margin, yPosition)
          yPosition += translationLines.length * 6 + 2
        }
      }

      // 6. 分类信息
      if (word.categories?.name || word.category) {
        const category = word.categories?.name || word.category || ''
        pdf.text(`   分类: ${category}`, margin, yPosition)
        yPosition += 7
      }

      // 添加分隔线
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, yPosition + 2, 190, yPosition + 2)
      yPosition += 15 // 词汇间距
    })

    // 保存 PDF
    const fileName = `词汇列表_${category}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  },

  // 导出为 Markdown
  exportToMarkdown(words, category = '全部') {
    let markdown = `# 词汇列表\n\n`
    markdown += `**分类:** ${category}\n`
    markdown += `**生成时间:** ${new Date().toLocaleDateString('zh-CN')}\n`
    markdown += `**总计:** ${words.length} 个词汇\n\n`
    markdown += `---\n\n`

    words.forEach((word, index) => {
      // 1. 英文单词标题
      markdown += `## ${index + 1}. ${word.word}\n\n`
      
      // 2. 音标
      if (word.phonetic || word.pronunciation) {
        const phonetic = word.phonetic || word.pronunciation || ''
        markdown += `**音标:** \`${phonetic}\`\n\n`
      }

      // 3. 单词释义
      const meaning = word.meaning || word.definition || ''
      markdown += `**释义:** ${meaning}\n\n`

      // 4. 例句
      if (word.example_sentence || word.example) {
        const example = word.example_sentence || word.example || ''
        markdown += `**例句:** ${example}\n\n`
        
        // 5. 例句释义
        if (word.example_translation || word.sentence_meaning) {
          const translation = word.example_translation || word.sentence_meaning || ''
          markdown += `**例句释义:** ${translation}\n\n`
        }
      }

      // 6. 分类信息
      if (word.categories?.name || word.category) {
        const wordCategory = word.categories?.name || word.category || ''
        markdown += `**分类:** ${wordCategory}\n\n`
      }

      // 添加分隔线
      markdown += `---\n\n`
    })

    // 创建并下载文件
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `词汇列表_${category}_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  // 导出当前页面为 PDF
  async exportPageToPDF(elementId, filename = 'page.pdf') {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('未找到要导出的元素')
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF()
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(filename)
    } catch (error) {
      console.error('PDF 导出失败:', error)
      throw error
    }
  }
}

// CSV 导出功能
export const csvService = {
  exportWordsToCSV(words, filename = 'vocabulary.csv') {
    const headers = ['单词', '音标', '释义', '例句', '例句释义', '分类', '创建时间', '点赞数']
    
    const csvContent = [
      headers.join(','),
      ...words.map(word => [
        `"${word.word || ''}"`,
        `"${word.phonetic || word.pronunciation || ''}"`,
        `"${word.meaning || word.definition || ''}"`,
        `"${word.example_sentence || word.example || ''}"`,
        `"${word.example_translation || word.sentence_meaning || ''}"`,
        `"${word.categories?.name || word.category || ''}"`,
        `"${new Date(word.created_at).toLocaleDateString('zh-CN')}"`,
        word.upvotes || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// JSON 导出功能
export const jsonService = {
  exportWordsToJSON(words, filename = 'vocabulary.json') {
    const dataStr = JSON.stringify(words, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
