# -*- coding: utf-8 -*-
"""
Gerador de PDF de Atualização do HelpClinTec em Linguagem Simples (Termos Leigos)
Documento básico e direto para o cliente entender as novidades de faturamento e relatórios.
"""

import os
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
            self.drawString(1.5 * cm, A4[1] - 1.0 * cm, "HelpClinTec · Novidades do Sistema: Faturamento e Relatórios")
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
    c_red = colors.HexColor("#DC2626")        # Vermelho
    c_text = colors.HexColor("#1E293B")       # Texto Escuro
    c_muted = colors.HexColor("#64748B")      # Texto Cinza
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
        fontSize=12.5,
        leading=16.5,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    callout_text_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
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
        fontSize=8.5,
        leading=11.5,
        textColor=c_text
    )

    story = []

    # =========================================================================
    # PÁGINA 1: CABEÇALHO, INTRODUÇÃO E NOVO FATURAMENTO SIMPLIFICADO
    # =========================================================================
    header_data = [
        [
            Paragraph("<b>HELP<font color='#E78368'>CLIN</font>TEC</b><br/><font size=7.5 color='#64748B'>Tecnologia Inteligente para Gestão Clínica</font>", title_style),
            Paragraph("<font size=8 color='#64748B'>Data: <b>Setembro/2026</b><br/>Para: <b>Clientes e Clínicas Parceiras</b><br/>Assunto: <b>Novidades do Sistema</b></font>", ParagraphStyle('RightHeader', alignment=2))
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
    story.append(Paragraph("Guia Simples das Novas Funções de Faturamento e Relatórios", subtitle_style))
    story.append(Spacer(1, 8))

    # Box de Boas-Vindas
    intro_html = (
        "<b>Olá!</b> O HelpClin foi atualizado para tornar o acompanhamento dos seus serviços e dos seus "
        "pagamentos muito mais fácil, claro e sem complicações. Confira abaixo, de forma bem direta, o que mudou "
        "e como aproveitar as novas funções no seu dia a dia."
    )
    intro_box = Table([[Paragraph(intro_html, callout_text_style)]], colWidths=[18.0 * cm])
    intro_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6F3")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#B7D6CA")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(intro_box)
    story.append(Spacer(1, 10))

    # Seção 1: Faturamento das Ordens
    story.append(Paragraph("1. O que mudou no Faturamento das Ordens de Serviço?", h1_style))
    story.append(Paragraph(
        "Agora você tem total controle e tranquilidade para saber quais ordens já foram pagas e quais ainda estão em aberto:",
        body_style
    ))

    novidades_faturamento = [
        "<b>Prazo tranquilo de 30 dias:</b> Assim que o técnico conclui o conserto ou atendimento, você tem até <b>30 dias</b> para fazer o pagamento. Nenhuma ordem recente é considerada atrasada durante esse prazo.",
        "<b>Você mesmo avisa quando pagou:</b> Na tela de Ordens de Serviço, apareceu o botão azul <b>[Informar Pagamento]</b>. Ao pagar (por PIX, transferência ou boleto), você só precisa clicar nele e informar o dia em que pagou.",
        "<b>Conferência rápida pelo técnico:</b> O técnico ou administrador recebe o seu aviso no sistema e confere o valor. Com um clique em <i>Confirmar Recebimento</i>, a ordem é quitada.",
        "<b>Recibo com data e hora gravados:</b> Quando a ordem é confirmada, ela ganha o selo verde <b>Faturada</b> com a data e o horário exatos em que o pagamento foi registrado, servindo como comprovante oficial."
    ]
    for n in novidades_faturamento:
        story.append(Paragraph(f"• {n}", bullet_style))
    story.append(Spacer(1, 8))

    # Tabela Simples e Leiga de Status
    story.append(Paragraph("Entenda o que significa cada status no sistema:", ParagraphStyle('SubH', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary)))
    status_leigo_data = [
        [
            Paragraph("COMO APARECE", table_header_style),
            Paragraph("O QUE SIGNIFICA", table_header_style),
            Paragraph("O QUE VOCÊ PODE FAZER", table_header_style)
        ],
        [
            Paragraph("<b>Não Faturada</b><br/><font size=7 color='#D97706'>Aguardando (até 30 dias)</font>", table_cell_style),
            Paragraph("O atendimento técnico já terminou. Está dentro do prazo normal para pagamento.", table_cell_style),
            Paragraph("Quando fizer o pagamento, basta clicar no botão <b>[Informar Pagamento]</b>.", table_cell_style)
        ],
        [
            Paragraph("<b>Pagamento Informado</b><br/><font size=7 color='#2563EB'>Aguardando confirmação</font>", table_cell_style),
            Paragraph("Você já avisou que pagou. A equipe do HelpClin está conferindo o comprovante.", table_cell_style),
            Paragraph("Não precisa fazer nada, só aguardar a baixa da equipe técnica.", table_cell_style)
        ],
        [
            Paragraph("<b>Faturada</b><br/><font size=7 color='#059669'>Pago e Confirmado</font>", table_cell_style),
            Paragraph("Tudo certo! Pagamento validado com sucesso e ordem 100% quitada.", table_cell_style),
            Paragraph("Pronto! A ordem está arquivada com data e hora para o seu controle.", table_cell_style)
        ],
        [
            Paragraph("<b>Atrasada</b><br/><font size=7 color='#DC2626'>Acima de 30 dias</font>", table_cell_style),
            Paragraph("Já se passaram mais de 30 dias desde a entrega do serviço e o pagamento não foi informado.", table_cell_style),
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
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(status_table)
    story.append(Spacer(1, 10))

    # Box Informativo
    box_tranquilidade_html = (
        "<b>IMPORTANTE:</b> O sistema respeita o seu tempo! Nenhuma cobrança ou aviso de atraso é gerado antes "
        "de 30 dias corridos após a entrega do serviço pelo técnico. Assim, sua clínica tem total tranquilidade "
        "para programar seus pagamentos no fluxo financeiro normal."
    )
    box_tranq = Table([[Paragraph(box_tranquilidade_html, callout_text_style)]], colWidths=[18.0 * cm])
    box_tranq.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#FCD34D")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(box_tranq)

    # QUEBRA PARA PÁGINA 2
    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: RELATÓRIOS SIMPLES, IMPRESSÃO SEM CORTE E PASSO A PASSO
    # =========================================================================
    story.append(Paragraph("2. O que há de novo na sua tela de Relatórios?", h1_style))
    story.append(Paragraph(
        "A tela de <b>Relatórios</b> agora é muito mais clara para você apresentar à diretoria ou ao setor financeiro:",
        body_style
    ))

    novidades_relatorios = [
        "<b>Data de Faturamento bem visível:</b> Você vê exatamente a data em que cada ordem foi quitada (ex: <i>Faturada em 19/09/2026 às 12:00</i>). As que ainda não foram pagas aparecem claramente como <i>Não Faturada</i>.",
        "<b>Tempo da Criação até o Pagamento:</b> O relatório calcula automaticamente quanto tempo levou desde o momento em que você abriu o chamado até o dia em que ele foi pago (ex: <code>Mesmo dia</code> ou <code>16 dias decorridos</code> conectando as duas datas: <code>03/09 ➔ 19/09</code>).",
        "<b>Resumo no topo da tela:</b> Cartões com números fáceis mostram o total de atendimentos do mês, quantas ordens já estão pagas (com a porcentagem) e a média de dias que costumam levar para serem quitadas.",
        "<b>Filtro Rápido com 1 clique:</b> Você pode filtrar a tela para mostrar apenas o que quiser: <i>Todas as Ordens</i>, <i>Apenas as Faturadas</i> ou <i>Apenas as Pendentes</i>.",
        "<b>Relatório Perfeito e Sem Cortes:</b> Organizamos a folha para que todas as informações fiquem 100% dentro do espaço da página. O nome do seu técnico responsável (ex: <b>Rodrigo Santos</b>) agora aparece completo, limpo e legível.",
        "<b>Escolha a orientação da folha:</b> Adicionamos o botão <b>[Alternar para Paisagem / Retrato]</b> para você imprimir o relatório em pé ou deitado, do jeito que preferir!"
    ]
    for r in novidades_relatorios:
        story.append(Paragraph(f"• {r}", bullet_style))
    story.append(Spacer(1, 10))

    # Seção 3: Passo a Passo Básico
    story.append(Paragraph("3. Como usar as novidades no seu dia a dia (Passo a Passo)", h1_style))

    passos_data = [
        [
            Paragraph("<b>COMO INFORMAR UM PAGAMENTO:</b>", ParagraphStyle('PassoH', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary)),
            Paragraph("<b>COMO GERAR E IMPRIMIR O RELATÓRIO:</b>", ParagraphStyle('PassoH2', parent=body_style, fontName='Helvetica-Bold', textColor=c_primary))
        ],
        [
            Paragraph(
                "<b>1.</b> No menu lateral, clique em <b>Ordens de Serviço</b>.<br/>"
                "<b>2.</b> Localize a ordem que você pagou.<br/>"
                "<b>3.</b> Clique no botão <b>[Informar Pagamento]</b>.<br/>"
                "<b>4.</b> Digite ou selecione a data em que pagou e clique em <b>Salvar</b>.<br/>"
                "<i>Pronto! A equipe técnica já recebe a notificação para dar baixa.</i>",
                body_style
            ),
            Paragraph(
                "<b>1.</b> No menu lateral, clique em <b>Relatórios</b>.<br/>"
                "<b>2.</b> Escolha o período ou filtro (ex: <i>Apenas Pendentes</i>).<br/>"
                "<b>3.</b> Clique em <b>[Visualizar Relatório]</b>.<br/>"
                "<b>4.</b> Se preferir a folha deitada, clique em <b>[Paisagem]</b>.<br/>"
                "<b>5.</b> Clique em <b>[Imprimir / Salvar em PDF]</b>.",
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
    story.append(Spacer(1, 12))

    # Box de Suporte e Contato
    suporte_html = (
        "<b>PRECISA DE AJUDA OU TEM DÚVIDAS?</b><br/>"
        "Nossa equipe técnica e de suporte está sempre ao seu lado para auxiliar no uso do sistema. "
        "Todos os seus dados, ordens e históricos de atendimentos estão seguros e atualizados no HelpClin."
    )
    suporte_box = Table([[
        Paragraph(suporte_html, callout_text_style),
        Paragraph("<b>Suporte HelpClinTec</b><br/>Atendimento ao Cliente e Clínicas<br/><b>Versão Atual:</b> 2.4.0 (Setembro/2026)", ParagraphStyle('SupRight', parent=body_style, alignment=2, fontSize=8, leading=11, textColor=c_primary))
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

if __name__ == '__main__':
    dest_folders = [
        r"f:\helpclin\atualização",
        r"f:\helpclin\atualizacao"
    ]

    for folder in dest_folders:
        os.makedirs(folder, exist_ok=True)
        pdf_name_1 = os.path.join(folder, "Atualizacao_Faturamento_HelpClin.pdf")
        pdf_name_2 = os.path.join(folder, "atualizacao.pdf")
        create_update_pdf(pdf_name_1)
        create_update_pdf(pdf_name_2)
