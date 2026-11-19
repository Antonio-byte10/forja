"""Gera os ícones do Forja (bigorna com faíscas) em assets/. Precisa só do Pillow: pip install pillow.

    python scripts/gerar-icones.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parent.parent / 'assets'
FUNDO = (10, 10, 11, 255)        # colors.bg
LARANJA = (255, 91, 31, 255)     # colors.accent
BRANCO = (255, 255, 255, 255)
S = 4                            # supersampling: desenha 4x maior e reduz, para bordas suaves

# Bigorna num quadro de 1024 px, chifre para a esquerda.
BIGORNA = [
    (170, 392), (330, 366), (830, 366), (830, 474), (706, 474), (642, 560), (642, 598),
    (752, 642), (752, 706), (292, 706), (292, 642), (402, 598), (402, 560), (344, 486),
    (300, 474), (236, 444),
]
# Faíscas saindo do ponto de batida.
FAISCAS = [((600, 318), (600, 214)), ((560, 326), (488, 250)), ((640, 326), (712, 250))]


def desenhar(tam: int, cor, fundo=None, escala=1.0, faiscas=True) -> Image.Image:
    big = tam * S
    img = Image.new('RGBA', (big, big), fundo or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = big / 1024 * escala
    off = big * (1 - escala) / 2 + big * 0.02 * escala  # centraliza (a bigorna é um pouco alta)
    pt = lambda p: (p[0] * k + off, p[1] * k + off)
    d.polygon([pt(p) for p in BIGORNA], fill=cor)
    if faiscas:
        w = int(30 * k)
        for a, b in FAISCAS:
            d.line([pt(a), pt(b)], fill=cor, width=w)
            for c in (a, b):
                x, y = pt(c)
                d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=cor)
    return img.resize((tam, tam), Image.LANCZOS)


def main():
    desenhar(1024, LARANJA, FUNDO).convert('RGB').save(ASSETS / 'icon.png')
    # Ícone adaptável do Android: o desenho fica no centro (área segura ~66%).
    desenhar(512, LARANJA, escala=0.74).save(ASSETS / 'android-icon-foreground.png')
    Image.new('RGBA', (512, 512), FUNDO).save(ASSETS / 'android-icon-background.png')
    desenhar(512, BRANCO, escala=0.74).save(ASSETS / 'android-icon-monochrome.png')
    desenhar(1024, LARANJA, escala=0.5).save(ASSETS / 'splash-icon.png')
    desenhar(48, LARANJA, FUNDO, escala=1.1, faiscas=False).save(ASSETS / 'favicon.png')
    # Ícone pequeno das notificações (Android pede branco sobre transparente).
    desenhar(96, BRANCO, escala=0.9).save(ASSETS / 'notification-icon.png')
    # Banner do README, com as fontes do app (precisa do npm install antes).
    fontes = ASSETS.parent / 'node_modules' / '@expo-google-fonts'
    titulo = ImageFont.truetype(str(fontes / 'barlow-condensed/800ExtraBold/BarlowCondensed_800ExtraBold.ttf'), 190)
    texto = ImageFont.truetype(str(fontes / 'barlow/500Medium/Barlow_500Medium.ttf'), 40)
    banner = Image.new('RGBA', (1280, 400), FUNDO)
    marca = desenhar(320, LARANJA)
    banner.alpha_composite(marca, (70, 30))
    d = ImageDraw.Draw(banner)
    d.text((420, 60), 'FORJA', font=titulo, fill=(245, 245, 244, 255))
    d.text((426, 270), 'Treino de força no seu celular.', font=texto, fill=(161, 161, 170, 255))
    d.text((426, 322), 'Sem conta, sem nuvem, código aberto.', font=texto, fill=LARANJA)
    banner.convert('RGB').save(ASSETS / 'banner.png')
    print('icones gerados em', ASSETS)


if __name__ == '__main__':
    main()
