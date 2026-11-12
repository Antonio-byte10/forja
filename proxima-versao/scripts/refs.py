import json, os, sys
from PIL import Image
src, out, idx = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
imgs = json.load(open(idx, encoding="utf-8"))["results"]
NOMES = {"454": "flexao_pike", "297": "canoa", "320": "polichinelo", "983": "joelho_alto", "1572": "perdigueiro", "1091": "prancha_toque_ombro",
         "456": "agachamento_pistol", "1733": "agachamento_parede", "1080": "flexao_hindu", "2681": "flexao_escapular", "1217": "flexao_dedos",
         "1551": "flexao", "957": "perdigueiro_2", "2530": "flexao_russa", "1112": "flexao_declinada", "265": "ponte_gluteo"}
LIC = {1: "CC BY-SA 3.0", 2: "CC BY-SA 4.0", 3: "CC0", 4: "CC BY 4.0"}
linhas = ["# Referências (wger.de)", "", "Fotos e desenhos da base aberta do wger, guardados só como **referência** para desenhar os bonecos.",
          "Os estilos são misturados (foto, desenho, ilustração), então a ideia não é usar no app.",
          "Para usar alguma, é preciso dar o crédito abaixo e manter a mesma licença.", "",
          "| Arquivo | Exercício (wger) | Licença | Autor |", "|---|---|---|---|"]
for f in sorted(os.listdir(src)):
    ex, nome = f.split("-", 1)
    meta = next(i for i in imgs if i["image"].endswith(nome))
    im = Image.open(os.path.join(src, f)).convert("RGB"); im.thumbnail((640, 640))
    alvo = NOMES[ex] + ".jpg"; im.save(os.path.join(out, alvo), "JPEG", quality=82, optimize=True)
    linhas.append(f"| {alvo} | [#{ex}](https://wger.de/exercise/{ex}/view/) | {LIC.get(meta['license'], meta['license'])} | {meta['license_author'] or '(sem nome)'} |")
open(os.path.join(out, "CREDITOS.md"), "w", encoding="utf-8").write("\n".join(linhas) + "\n")
print("ok", len(os.listdir(out)))
