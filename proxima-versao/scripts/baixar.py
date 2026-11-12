"""Baixa as 2 fotos (início/fim do movimento) de cada exercício da lista, no mesmo tamanho das
fotos atuais do app (640x427), e grava o índice em JSON. Uso: python -P baixar.py <exercises.json> <raw_dir> <saida>"""
import json, os, sys, urllib.request
from io import BytesIO
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lista import L, FOTO_2_PRINCIPAL

base_json, raw_dir, out = sys.argv[1:4]
db = {e["id"]: e for e in json.load(open(base_json, encoding="utf-8"))}
img_dir = os.path.join(out, "imagens")
os.makedirs(img_dir, exist_ok=True)
URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

keys = [k for k, *_ in L]
assert len(keys) == len(set(keys)), "chave repetida"
index, falhas = [], []
for key, name, group, kind, place, equip, src in L:
    e = db.get(src)
    if not e:
        falhas.append((key, src, "não existe na base"))
        continue
    files = []
    rels = e["images"][:2]
    if key in FOTO_2_PRINCIPAL:
        rels = rels[::-1]
    for i, rel in enumerate(rels):
        raw = os.path.join(raw_dir, rel.replace("/", "__"))
        if not os.path.exists(raw):
            urllib.request.urlretrieve(URL + rel, raw)
        img = Image.open(raw)
        img.verify()
        img = Image.open(raw).convert("RGB").resize((640, 427), Image.LANCZOS)
        name_out = f"{key}.jpg" if i == 0 else f"{key}_2.jpg"
        img.save(os.path.join(img_dir, name_out), "JPEG", quality=82, optimize=True, progressive=True)
        files.append(f"imagens/{name_out}")
    index.append({
        "chave": key, "nome": name, "grupo": group, "tipo": kind, "lugar": place, "equipamento": equip,
        "nivel": e["level"], "musculos": e["primaryMuscles"] + e["secondaryMuscles"],
        "imagens": files, "fonte": f"free-exercise-db: {src}", "instrucoes_en": e["instructions"],
    })

json.dump(index, open(os.path.join(out, "exercicios.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(index), "exercícios;", sum(len(x["imagens"]) for x in index), "imagens")
for f in falhas:
    print("FALHA", f)
