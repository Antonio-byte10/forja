"""Monta forja-posts.html (autocontido) a partir de posts.template.html, embutindo logo e telas em base64."""
import base64, re
from pathlib import Path
from PIL import Image
import io
AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
def svg_uri(p, troca=None):
    s = (RAIZ / p).read_text(encoding='utf-8')
    if troca: s = s.replace(*troca)
    return 'data:image/svg+xml;base64,' + base64.b64encode(s.encode()).decode()
def jpg_uri(p):
    im = Image.open(RAIZ / p).convert('RGB')
    if im.width < 468: im = im.resize((468, 1013), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=88)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
subs = {
  'MARCA_LARANJA': svg_uri('branding/logo/forja-marca-laranja.svg'),
  'MARCA_ESCURA': svg_uri('branding/logo/forja-marca-laranja.svg', ('#FF5B1F', '#140802')),
  'TELA_INICIO': jpg_uri('docs/telas/inicio.jpg'),
  'TELA_TREINO': jpg_uri('docs/telas/treino.jpg'),
  'TELA_PROGRESSO': jpg_uri('docs/telas/progresso.jpg'),
}
html = (AQUI / 'posts.template.html').read_text(encoding='utf-8')
html = re.sub(r'\{\{(\w+)\}\}', lambda m: subs[m.group(1)], html)
(AQUI / 'forja-posts.html').write_text(html, encoding='utf-8')
print(len(html), 'bytes')
