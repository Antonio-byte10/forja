"""Gera o logo do Forja em SVG (vetor exato) em branding/logo/, a partir da mesma geometria de gerar-icones.py.
O nome "FORJA" vira contorno (Barlow Condensed ExtraBold), então o SVG não depende de fonte instalada.
Precisa de fontTools (pip install fonttools) e do npm install (para a fonte).

    python scripts/gerar-logo-svg.py
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'branding' / 'logo'
FONTE = RAIZ / 'node_modules/@expo-google-fonts/barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf'

LARANJA, FUNDO, CLARO, PRETO = '#FF5B1F', '#0A0A0B', '#F5F5F4', '#0A0A0B'

BIGORNA = [
    (170, 392), (330, 366), (830, 366), (830, 474), (706, 474), (642, 560), (642, 598),
    (752, 642), (752, 706), (292, 706), (292, 642), (402, 598), (402, 560), (344, 486),
    (300, 474), (236, 444),
]
FAISCAS = [((600, 318), (600, 214)), ((560, 326), (488, 250)), ((640, 326), (712, 250))]
# Caixa do desenho no quadro de 1024: x 170..830, y 199..706 (faíscas com ponta redonda de 15).
X0, Y0, X1, Y1 = 170, 199, 830, 706


def marca(cor: str) -> str:
    pts = ' '.join(f'{x},{y}' for x, y in BIGORNA)
    linhas = ''.join(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}"/>' for a, b in FAISCAS)
    return (f'<polygon points="{pts}" fill="{cor}"/>'
            f'<g stroke="{cor}" stroke-width="30" stroke-linecap="round">{linhas}</g>')


def texto(palavra: str, altura_caps: float, x: float, y_base: float, cor: str, espaco=0.02) -> tuple[str, float]:
    """Contorno de `palavra` com a altura de maiúscula pedida; devolve (path, largura)."""
    f = TTFont(FONTE)
    gs, cmap, hmtx = f.getGlyphSet(), f.getBestCmap(), f['hmtx']
    caps = f['OS/2'].sCapHeight
    k = altura_caps / caps
    pen = SVGPathPen(gs)
    cx = 0.0
    for i, ch in enumerate(palavra):
        nome = cmap[ord(ch)]
        gs[nome].draw(TransformPen(pen, (k, 0, 0, -k, x + cx, y_base)))
        cx += hmtx[nome][0] * k + (altura_caps * espaco if i < len(palavra) - 1 else 0)
    return f'<path d="{pen.getCommands()}" fill="{cor}"/>', cx


def svg(w: float, h: float, corpo: str, fundo: str | None = None, vb=None) -> str:
    vb = vb or f'0 0 {w:g} {h:g}'
    vx, vy, vw, vh = vb.split()
    bg = f'<rect x="{vx}" y="{vy}" width="{vw}" height="{vh}" fill="{fundo}"/>' if fundo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w:g}" height="{h:g}">'
            f'<title>Forja</title>{bg}{corpo}</svg>\n')


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    pad = 20
    vb_marca = f'{X0 - pad} {Y0 - pad} {X1 - X0 + 2 * pad} {Y1 - Y0 + 2 * pad}'
    mw, mh = X1 - X0 + 2 * pad, Y1 - Y0 + 2 * pad
    for nome, cor in [('laranja', LARANJA), ('branco', CLARO), ('preto', PRETO)]:
        (SAIDA / f'forja-marca-{nome}.svg').write_text(svg(mw, mh, marca(cor), vb=vb_marca), encoding='utf-8')

    # Ícone do app (quadrado, fundo escuro), igual ao icon.png.
    (SAIDA / 'forja-icone-app.svg').write_text(
        svg(1024, 1024, f'<g transform="translate(0 20)">{marca(LARANJA)}</g>', FUNDO), encoding='utf-8')

    # Assinatura horizontal: marca + FORJA. A marca ocupa a altura do nome + faíscas.
    caps = 300
    escala = 1.0
    gap = 70
    mx = -X0 + pad
    base = Y1  # a base do nome alinha com a base da bigorna
    for nome, cor_m, cor_t, fundo in [('escuro', LARANJA, CLARO, FUNDO), ('claro', LARANJA, PRETO, None),
                                        ('transparente-claro', LARANJA, CLARO, None)]:
        p, largura = texto('FORJA', caps, X1 - X0 + pad + gap, base, cor_t)
        corpo = f'<g transform="translate({mx} 0) scale({escala})">{marca(cor_m)}</g>{p}'
        w = X1 - X0 + pad + gap + largura + pad + 20
        vb = f'0 {Y0 - pad - 20} {w:g} {Y1 - Y0 + 2 * pad + 40}'
        (SAIDA / f'forja-assinatura-{nome}.svg').write_text(
            svg(w, Y1 - Y0 + 2 * pad + 40, corpo, fundo, vb=vb), encoding='utf-8')
    print('logos em', SAIDA)


if __name__ == '__main__':
    main()
