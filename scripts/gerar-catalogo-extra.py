"""Gera src/data/catalogExtra.ts e copia as fotos de proxima-versao/imagens para assets/exercises.
Uso (na pasta do app): python -P scripts/gerar-catalogo-extra.py"""
import json, re, shutil

novos = json.load(open("proxima-versao/exercicios.json", encoding="utf-8"))
existentes = set(re.findall(r"^  (\w+): \{ name:", open("src/data/catalog.ts", encoding="utf-8").read(), re.M))
ANIM = {"flexao_aberta": "flexao_aberta", "tesoura": "tesoura", "canivete": "v_up"}

linhas, grupo = [], None
for e in novos:
    k = e["chave"]
    assert k not in existentes, f"chave repetida: {k}"
    for sufixo in ("", "_2"):
        shutil.copyfile(f"proxima-versao/imagens/{k}{sufixo}.jpg", f"assets/exercises/{k}{sufixo}.jpg")
    if e["grupo"] != grupo:
        grupo = e["grupo"]
        linhas.append(f"  // {grupo}")
    nome = e["nome"].replace("'", "\\'")
    anim = f", anim: '{ANIM[k]}'" if k in ANIM else ""
    linhas.append(
        f"  {k}: {{ name: '{nome}', group: '{grupo}', unilateral: false, medida: '{e['tipo']}'{anim}, "
        f"image: require('../../assets/exercises/{k}.jpg'), image2: require('../../assets/exercises/{k}_2.jpg') }},"
    )

# Exercícios sem foto: o boneco animado faz o papel da imagem.
BONECOS = [
    ("flexao_parede", "Flexão na parede", "Peito", "reps"), ("flexao_joelhos", "Flexão com joelhos apoiados", "Peito", "reps"),
    ("flexao_negativa", "Flexão negativa (desce em 3 s)", "Peito", "reps"), ("flexao_pike", "Flexão pike (quadril alto)", "Ombros", "reps"),
    ("flexao_escapular", "Flexão escapular", "Ombros", "reps"), ("suspensao_barra", "Suspensão na barra (dead hang)", "Costas", "tempo"),
    ("agachamento_parede", "Agachamento isométrico na parede", "Pernas", "tempo"), ("canoa", "Canoa (hollow hold)", "Abdômen", "tempo"),
    ("prancha_toque_ombro", "Prancha com toque no ombro", "Abdômen", "reps"), ("perdigueiro", "Perdigueiro (bird dog)", "Abdômen", "reps"),
    ("escalador_lento", "Escalador lento (sem salto)", "Abdômen", "reps"), ("marcha_joelho_alto", "Marcha com joelho alto", "Condicionamento", "tempo"),
    ("polichinelo", "Polichinelo", "Condicionamento", "reps"),
]
linhas.append("  // Sem foto: só o boneco animado")
for k, nome, grupo, medida in BONECOS:
    assert k not in existentes and not any(e["chave"] == k for e in novos), f"chave repetida: {k}"
    linhas.append(f"  {k}: {{ name: '{nome}', group: '{grupo}', unilateral: false, medida: '{medida}', anim: '{k}' }},")

open("src/data/catalogExtra.ts", "w", encoding="utf-8", newline="\n").write(
    "// GERADO por scripts/gerar-catalogo-extra.py a partir de proxima-versao/exercicios.json. Não edite à mão.\n"
    "import type { CatalogItem } from './catalog';\n\n"
    "/** Peso do corpo, condicionamento, cardio e alongamento. Fotos: free-exercise-db (domínio público). */\n"
    "export const catalogExtra: Record<string, CatalogItem> = {\n" + "\n".join(linhas) + "\n};\n"
)
print(len(novos), "com foto +", len(BONECOS), "só boneco")
