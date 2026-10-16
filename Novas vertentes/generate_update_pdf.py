# -*- coding: utf-8 -*-
"""
Gerador de PDF de Atualização do HelpClinTec em Linguagem Simples (Termos Leigos)
Documento completo, direto e visual para o cliente entender as novidades:
- Faturamento Simplificado (30 dias)
- Relatórios Sem Cortes (Paisagem / Retrato)
- Nova Busca Inteligente e Tolerante a Números
- Novo Modo Escuro Suave e Sincronização com Dispositivo (Windows / Celular)
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
import pymupdf

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8.5)
        self.setFillColor(colors.HexColor("#64748B"))

        # Cabeçalho a partir da página 2
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#DCE7DF"))
            self.setLineWidth(0.6)
            self.line(1.5 * cm, A4[1] - 1.2 * cm, A4[0] - 1.5 * cm, A4[1] - 1.2 * cm)
            self.drawString(1.5 * cm, A4[1] - 1.0 * cm, "HelpClinTec · Novidades do Sistema: Faturamento, Busca e Modo Escuro")
            self.drawRightString(A4[0] - 1.5 * cm, A4[1] - 1.0 * cm, "Guia Rápido do Usuário · Setembro/2026")

        # Rodapé em todas as páginas
        self.setStrokeColor(colors.HexColor("#DCE7DF"))
        self.setLineWidth(0.6)
        self.line(1.5 * cm, 1.3 * cm, A4[0] - 1.5 * cm, 1.3 * cm)
        self.drawString(1.5 * cm, 0.9 * cm, "HelpClinTec · Sistema de Gestão e Manutenção Clínica · Guia Prático")
        self.drawRightString(A4[0] - 1.5 * cm, 0.9 * cm, f"Página {self._pageNumber} de {page_count}")
        self.restoreState()

def create_update_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm
    )

    styles = getSampleStyleSheet()

    # Cores Oficiais HelpClinTec
    c_primary = colors.HexColor("#123B3D")    # Teal Escuro
    c_secondary = colors.HexColor("#E78368")  # Coral
    c_green = colors.HexColor("#059669")      # Verde Sucesso
    c_amber = colors.HexColor("#D97706")      # Âmbar Alerta
    c_blue = colors.HexColor("#2563EB")       # Azul Informativo
    c_text = colors.HexColor("#1E293B")       # Texto Escuro
    c_bg_light = colors.HexColor("#F8FBF9")   # Fundo Suave
    c_line = colors.HexColor("#DCE7DF")       # Linha Divisória

    # Estilos de Tipografia
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_secondary
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_text,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_text,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3.5
    )

    callout_text_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#143B3D")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_text
    )

    story = []

    # =========================================================================
    # PÁGINA 1: CABEÇALHO, INTRODUÇÃO E NOVO FATURAMENTO SIMPLIFICADO
    # =========================================================================
    header_data = [
        [
            Paragraph("<b>HELP<font color='#E78368'>CLIN</font>TEC</b><br/><font size=7.5 color='#64748B'>Tecnologia Inteligente para Gestão Clínica</font>", title_style),
            Paragraph("<font size=8 color='#64748B'>Data: <b>Setembro/2026</b><br/>Para: <b>Clientes e Clínicas Parceiras</b><br/>Assunto: <b>Novidades do Sistema (v2.5)</b></font>", ParagraphStyle('RightHeader', alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[11.0 * cm, 7.0 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=4, spaceAfter=8))

    story.append(Paragraph("NOVIDADES NO SEU SISTEMA HELPCLIN", title_style))
    story.append(Paragraph("Guia Prático: Faturamento, Relatórios, Busca Inteligente e Modo Escuro", subtitle_style))
    story.append(Spacer(1, 6))

    # Box de Boas-Vindas
    intro_html = (
        "<b>Olá!</b> O HelpClin recebeu uma importante atualização para tornar o seu trabalho muito mais fácil, "
        "rápido e agradável. Preparamos novidades no controle de pagamentos das ordens, relatórios completos sem cortes, "
        "uma busca que entende qualquer número digitado e o novo Modo Escuro com sincronização ao seu aparelho. "
        "Confira abaixo o resumo das novidades preparadas para você."
    )
    intro_box = Table([[Paragraph(intro_html, callout_text_style)]], colWidths=[18.0 * cm])
    intro_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6F3")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#B7D6CA")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(intro_box)
    story.append(Spacer(1, 8))

    # Seção 1: Faturamento das Ordens
    story.append(Paragraph("1. O que mudou no Faturamento das Ordens de Serviço?", h1_style))
    story.append(Paragraph(
        "Agora você tem total controle e previsibilidade sobre o pagamento das ordens concluídas:",
        body_style
    ))

    novidades_faturamento = [
        "<b>Prazo tranquilo de 30 dias:</b> Após a conclusão do serviço pelo técnico, você tem até <b>30 dias corridos</b> para realizar o pagamento. Nenhuma ordem é dada como atrasada dentro desse prazo.",
        "<b>Você mesmo informa quando pagou:</b> Na tela de Ordens de Serviço, utilize o botão <b>[Informar Pagamento]</b>. Ao pagar (PIX, boleto ou transferência), basta registrar a data do pagamento com 1 clique.",
        "<b>Conferência e baixa rápida:</b> A equipe técnica recebe o aviso, valida o comprovante e confirma o recebimento no sistema, garantindo segurança para as duas partes.",
        "<b>Comprovante com data e hora:</b> Assim que confirmada, a ordem recebe o selo verde <b>Faturada</b> com a data e horário exatos em que a quitação foi homologada."
    ]
    for n in novidades_faturamento:
        story.append(Paragraph(f"• {n}", bullet_style))
    story.append(Spacer(1, 6))

    # Tabela Simples de Status
    story.append(Paragraph("Significado dos status no sistema:", ParagraphStyle('SubH', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary)))
    status_leigo_data = [
        [
            Paragraph("COMO APARECE", table_header_style),
            Paragraph("O QUE SIGNIFICA", table_header_style),
            Paragraph("O QUE VOCÊ PODE FAZER", table_header_style)
        ],
        [
            Paragraph("<b>Não Faturada</b><br/><font size=7 color='#D97706'>Aguardando (até 30 dias)</font>", table_cell_style),
            Paragraph("Atendimento concluído. Prazo normal de faturamento.", table_cell_style),
            Paragraph("Ao realizar o pagamento, clique em <b>[Informar Pagamento]</b>.", table_cell_style)
        ],
        [
            Paragraph("<b>Pagamento Informado</b><br/><font size=7 color='#2563EB'>Aguardando confirmação</font>", table_cell_style),
            Paragraph("Você informou o pagamento. Equipe conferindo o valor.", table_cell_style),
            Paragraph("Tudo pronto! Basta aguardar a validação técnica.", table_cell_style)
        ],
        [
            Paragraph("<b>Faturada</b><br/><font size=7 color='#059669'>Pago e Confirmado</font>", table_cell_style),
            Paragraph("Pagamento 100% validado e comprovante emitido.", table_cell_style),
            Paragraph("Ordem quitada e arquivada para controle contábil.", table_cell_style)
        ],
        [
            Paragraph("<b>Atrasada</b><br/><font size=7 color='#DC2626'>Acima de 30 dias</font>", table_cell_style),
            Paragraph("Prazo de 30 dias após a entrega foi ultrapassado.", table_cell_style),
            Paragraph("Favor verificar a pendência e clicar em <b>[Informar Pagamento]</b>.", table_cell_style)
        ]
    ]
    status_table = Table(status_leigo_data, colWidths=[4.8 * cm, 7.2 * cm, 6.0 * cm])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_line),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 8))

    box_tranquilidade_html = (
        "<b>TRANQUILIDADE PARA SUA CLÍNICA:</b> O sistema respeita o fluxo financeiro do seu estabelecimento. "
        "Nenhum alerta de atraso é gerado antes de 30 dias corridos da entrega do serviço."
    )
    box_tranq = Table([[Paragraph(box_tranquilidade_html, callout_text_style)]], colWidths=[18.0 * cm])
    box_tranq.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#FCD34D")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(box_tranq)

    # QUEBRA PARA PÁGINA 2
    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: RELATÓRIOS E NOVA BUSCA INTELIGENTE DE ORDENS
    # =========================================================================
    story.append(Paragraph("2. O que há de novo na tela de Relatórios?", h1_style))
    story.append(Paragraph(
        "A tela de <b>Relatórios</b> agora é ideal para prestação de contas à diretoria e contabilidade:",
        body_style
    ))

    novidades_relatorios = [
        "<b>Data de Faturamento nítida:</b> Exibição da data e horário em que cada ordem foi quitada (ex: <i>Faturada em 19/09/2026 às 12:00</i>).",
        "<b>Relação Criação até Pagamento:</b> Cálculo automático do tempo decorrido desde a abertura do chamado até o pagamento (ex: <code>Mesmo dia</code> ou <code>16 dias decorridos: 03/09 ➔ 19/09</code>).",
        "<b>Folha sem Cortes:</b> A tabela foi reconfigurada para caber com 100% de nitidez na folha A4, com o nome do técnico responsável sempre legível.",
        "<b>Impressão em Paisagem ou Retrato:</b> Adicionado o botão <b>[Alternar para Paisagem]</b> para você imprimir a tabela em pé ou deitada com visual limpo."
    ]
    for r in novidades_relatorios:
        story.append(Paragraph(f"• {r}", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. Nova Busca Inteligente e Tolerante de Ordens e Chamados", h1_style))
    story.append(Paragraph(
        "Encontrar uma ordem de serviço ou chamado ficou incrivelmente mais rápido e sem frustrações:",
        body_style
    ))

    novidades_busca = [
        "<b>Entende qualquer formato do número:</b> Se você busca a ordem 15, não precisa digitar idêntico ao sistema. Você pode digitar <code>15</code>, <code>015</code>, <code>00015</code>, <code>OS-15</code>, <code>OS 15</code> ou <code>OS-00015</code> — o sistema localiza imediatamente!",
        "<b>Digitação progressiva:</b> Não apaga mais a lista enquanto você digita. Conforme você tecla <code>OS-</code> ou números parciais, o sistema vai refinando os resultados suavemente.",
        "<b>Sem preocupação com acentos:</b> Você pode digitar sem acentos que o sistema encontra perfeitamente (ex: <code>sao jose</code> encontra <i>São José</i>; <code>manutencao</code> encontra <i>Manutenção</i>).",
        "<b>Busca por múltiplos termos:</b> Você pode pesquisar o número e o cliente juntos, como <code>hospital 15</code> ou <code>preventiva os-15</code>.",
        "<b>Disponível em todas as telas:</b> A nova busca inteligente está ativa em <b>Ordens de Serviço</b>, <b>Chamados Técnicos</b>, <b>Relatórios</b>, <b>Dashboard</b> e <b>Inventário</b>."
    ]
    for b in novidades_busca:
        story.append(Paragraph(f"• {b}", bullet_style))
    story.append(Spacer(1, 8))

    box_busca_html = (
        "<b>EXEMPLO PRÁTICO DE BUSCA:</b><br/>"
        "Se a ordem na tela é <b>OS-00015 (Hospital São José)</b>, você pode encontrá-la digitando apenas:<br/>"
        "• <code>15</code> &nbsp;&nbsp;|&nbsp;&nbsp; • <code>OS-15</code> &nbsp;&nbsp;|&nbsp;&nbsp; • <code>00015</code> &nbsp;&nbsp;|&nbsp;&nbsp; • <code>hospital 15</code> &nbsp;&nbsp;|&nbsp;&nbsp; • <code>sao jose</code>"
    )
    box_busca = Table([[Paragraph(box_busca_html, callout_text_style)]], colWidths=[18.0 * cm])
    box_busca.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6F3")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#B7D6CA")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(box_busca)

    # QUEBRA PARA PÁGINA 3
    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 3: NOVO MODO ESCURO, ESCOLHA DO CLIENTE E PASSO A PASSO
    # =========================================================================
    story.append(Paragraph("4. Novo Modo Escuro Executivo com Sincronização de Dispositivo", h1_style))
    story.append(Paragraph(
        "Criamos uma experiência visual elegante e relaxante para o uso do HelpClin no computador e no celular:",
        body_style
    ))

    novidades_dark = [
        "<b>Visual Suave e Anti-Reflexo:</b> Paleta executiva em tons de ardósia e azul-marinho profundo (<code>#0b1319</code>), reduzindo o cansaço visual em salas clínicas, plantões e ambientes com pouca luz.",
        "<b>Você Sempre no Controle (Sem Ativação Forçada):</b> O HelpClin inicia no Modo Claro tradicional. Ao detectar que seu aparelho (Windows, macOS, iOS ou Android) usa modo noturno, surge um convite amigável perguntando se deseja ativar.",
        "<b>Sincronização em Tempo Real com seu Sistema:</b> Se escolher sincronizar, sempre que seu celular ou computador mudar entre claro e escuro, o HelpClin acompanha automaticamente em tempo real.",
        "<b>Seletor de Tema no Topo:</b> Na barra de navegação superior, clique no botão de tema para escolher a qualquer momento:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;• <b>Sistema (Auto):</b> Acompanha dinamicamente o tema do seu dispositivo.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;• <b>Modo Claro:</b> Mantém o visual clássico claro.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;• <b>Modo Escuro:</b> Mantém o visual noturno relaxante."
    ]
    for d in novidades_dark:
        story.append(Paragraph(f"• {d}", bullet_style))
    story.append(Spacer(1, 8))

    # Seção 5: Passo a Passo Prático
    story.append(Paragraph("5. Passo a Passo Rápido para o seu Dia a Dia", h1_style))

    passos_data = [
        [
            Paragraph("<b>INFORMAR UM PAGAMENTO:</b>", ParagraphStyle('PassoH', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary)),
            Paragraph("<b>GERAR RELATÓRIO / ALTERNAR TEMA:</b>", ParagraphStyle('PassoH2', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary))
        ],
        [
            Paragraph(
                "<b>1.</b> No menu, clique em <b>Ordens de Serviço</b>.<br/>"
                "<b>2.</b> Localize a ordem usando o número ou cliente.<br/>"
                "<b>3.</b> Clique no botão <b>[Informar Pagamento]</b>.<br/>"
                "<b>4.</b> Confirme a data em que pagou e salve.<br/>"
                "<i>A equipe técnica recebe a notificação na hora!</i>",
                body_style
            ),
            Paragraph(
                "<b>Relatório:</b> Menu <b>Relatórios</b> ➔ Escolha os filtros ➔ Clique em <b>[Paisagem]</b> ou <b>[Imprimir]</b>.<br/><br/>"
                "<b>Alternar Tema:</b> Clique no botão <b>Sistema / Claro / Escuro</b> no canto superior direito para trocar a qualquer momento.",
                body_style
            )
        ]
    ]
    passos_table = Table(passos_data, colWidths=[9.0 * cm, 9.0 * cm])
    passos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F3")),
        ('GRID', (0, 0), (-1, -1), 0.5, c_line),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(passos_table)
    story.append(Spacer(1, 10))

    # Box de Suporte e Contato
    suporte_html = (
        "<b>PRECISA DE AJUDA OU TEM DÚVIDAS?</b><br/>"
        "Nossa equipe técnica e de suporte está sempre ao seu lado para auxiliar no uso do sistema. "
        "Todos os seus dados, ordens e históricos de atendimentos estão seguros e atualizados no HelpClin."
    )
    suporte_box = Table([[
        Paragraph(suporte_html, callout_text_style),
        Paragraph("<b>Suporte HelpClinTec</b><br/>Atendimento ao Cliente e Clínicas<br/><b>Versão Atual:</b> 2.5.0 (Setembro/2026)", ParagraphStyle('SupRight', parent=body_style, alignment=2, fontSize=8, leading=11, textColor=c_primary))
    ]], colWidths=[11.5 * cm, 6.5 * cm])
    suporte_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6F3")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#B7D6CA")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(suporte_box)

    # Construir PDF com NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF gerado com sucesso em: {output_path}")

def convert_pdf_to_images(pdf_path, output_dir):
    """Converte as páginas do PDF em imagens PNG de alta resolução para envio rápido no WhatsApp/email."""
    doc = pymupdf.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=200)
        img_path = os.path.join(output_dir, f"pagina_{i + 1}.png")
        pix.save(img_path)
        print(f"Página {i + 1} convertida em imagem: {img_path}")
    doc.close()

if __name__ == '__main__':
    # Manter estritamente UMA ÚNICA PASTA limpa para envio ao cliente
    single_folder = r"f:\helpclin\atualizacao"

    # Se existir a pasta com acento ou duplicada, removemos para evitar duplicidade
    duplicate_folder = r"f:\helpclin\atualização"
    if os.path.exists(duplicate_folder) and os.path.abspath(duplicate_folder) != os.path.abspath(single_folder):
        try:
            shutil.rmtree(duplicate_folder)
            print(f"Pasta duplicada removida: {duplicate_folder}")
        except Exception as e:
            print(f"Aviso ao remover pasta duplicada: {e}")

    os.makedirs(single_folder, exist_ok=True)

    # Nome definitivo e profissional do PDF para o cliente
    pdf_filename = os.path.join(single_folder, "Novidades_e_Atualizacoes_HelpClin.pdf")
    create_update_pdf(pdf_filename)

    # Gera imagens de visualização de cada página
    convert_pdf_to_images(pdf_filename, single_folder)
    print(f"\nDocumentação finalizada com sucesso em: {single_folder}")

