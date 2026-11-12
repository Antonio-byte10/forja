"""Gera proxima-versao/galeria.html (abre direto no navegador, sem servidor). Uso: python -P galeria.py <proxima-versao>"""
import json, sys, html

out = sys.argv[1]
novos = json.load(open(f"{out}/exercicios.json", encoding="utf-8"))
# Já existem no app e servem para treino sem peso (fotos em assets/exercises).
ja = [
    ("flexao", "Flexão de braço", "Peito"), ("flexao_inclinada", "Flexão inclinada", "Peito"),
    ("flexao_pes_elevados", "Flexão com pés elevados", "Peito"), ("flexao_diamante", "Flexão fechada (diamante)", "Tríceps"),
    ("barra_fixa", "Barra fixa", "Costas"), ("barra_supinada", "Barra fixa supinada", "Costas"),
    ("remada_invertida", "Remada invertida", "Costas"), ("hiperextensao", "Hiperextensão lombar", "Costas"),
    ("paralelas", "Paralelas", "Tríceps"), ("paralelas_peito", "Paralelas (ênfase no peito)", "Peito"),
    ("mergulho_banco", "Mergulho no banco", "Tríceps"), ("agachamento_livre_corpo", "Agachamento sem peso", "Pernas"),
    ("split_squat", "Agachamento afundo parado", "Pernas"), ("step_up", "Subida no banco (step-up)", "Pernas"),
    ("gluteo_4_apoios", "Glúteo 4 apoios", "Glúteos"), ("ponte_unilateral", "Ponte de glúteo unilateral", "Glúteos"),
    ("prancha", "Prancha", "Abdômen"), ("prancha_lateral", "Prancha lateral", "Abdômen"),
    ("abdominal", "Abdominal", "Abdômen"), ("abdominal_infra", "Abdominal infra", "Abdômen"),
    ("abdominal_supra", "Abdominal completo", "Abdômen"), ("abdominal_obliquo", "Abdominal oblíquo", "Abdômen"),
    ("elevacao_pernas", "Elevação de pernas deitado", "Abdômen"), ("elevacao_pernas_barra", "Elevação de pernas na barra", "Abdômen"),
    ("giro_russo", "Giro russo", "Abdômen"), ("dead_bug", "Dead bug", "Abdômen"),
]
TEMPO = {"prancha", "prancha_lateral"}
items = [dict(x, novo=True) for x in novos] + [
    {"chave": k, "nome": n, "grupo": g, "tipo": "tempo" if k in TEMPO else "reps", "lugar": "casa", "equipamento": "",
     "imagens": [f"../assets/exercises/{k}.jpg"], "novo": False} for k, n, g in ja
]
data = json.dumps([{k: x[k] for k in ("chave", "nome", "grupo", "tipo", "lugar", "equipamento", "imagens", "novo")} for x in items], ensure_ascii=False)

page = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Próxima versão: exercícios</title>
<style>
:root{--bg:#0A0A0B;--surface:#16161a;--raised:#222228;--text:#f2f2f2;--sub:#9a9aa3;--accent:#FF5B1F;--line:#2a2a30}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.4 system-ui,sans-serif}
header{padding:20px 16px 8px;max-width:1200px;margin:auto}h1{margin:0 0 4px;font-size:26px}p{margin:0;color:var(--sub)}
.bar{position:sticky;top:0;background:var(--bg);padding:10px 16px;border-bottom:1px solid var(--line);z-index:2}
.bar>div{max-width:1200px;margin:auto;display:flex;flex-wrap:wrap;gap:6px}
button{background:var(--raised);color:var(--text);border:0;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
button.on{background:var(--accent);color:#140802;font-weight:600}.sep{width:100%;height:0}
main{max-width:1200px;margin:auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.card{background:var(--surface);border-radius:14px;overflow:hidden}.card img{width:100%;aspect-ratio:1.5;object-fit:cover;display:block;background:var(--raised)}
.info{padding:10px 12px 12px}.nome{font-weight:600}.meta{color:var(--sub);font-size:12px;margin-top:4px}
.tag{display:inline-block;font-size:11px;padding:2px 7px;border-radius:6px;background:var(--raised);margin:6px 4px 0 0}
.tag.novo{background:var(--accent);color:#140802;font-weight:600}#n{color:var(--accent)}@media(max-width:700px){.bar{position:static}}
</style></head><body>
<header><h1>Exercícios para a próxima versão</h1>
<p><span id="n"></span> · as fotos novas alternam entre início e fim do movimento (ideia de “mini animação”). Fotos: free-exercise-db, domínio público. <a href="ficha.html" style="color:var(--accent)">Ver a Ficha F e os bonecos animados →</a></p></header>
<div class="bar"><div id="f"></div></div><main id="g"></main>
<script>
const D=__DATA__;
const F={origem:["Todos","Novos","Já no app"],tipo:["Todos","reps","tempo","cardio","alongamento"],lugar:["Todos","casa","academia","rua"],grupo:["Todos",...new Set(D.map(x=>x.grupo))]};
const L={reps:"repetições",tempo:"por tempo",cardio:"cardio (tempo + distância)",alongamento:"alongamento"};
const sel={origem:"Todos",tipo:"Todos",lugar:"Todos",grupo:"Todos"};
const f=document.getElementById("f"),g=document.getElementById("g");
function bar(){f.innerHTML="";for(const k in F){for(const v of F[k]){const b=document.createElement("button");b.textContent=v==="Todos"?k[0].toUpperCase()+k.slice(1)+": todos":(L[v]||v);if(sel[k]===v)b.className="on";b.onclick=()=>{sel[k]=v;bar();draw()};f.append(b)}f.append(Object.assign(document.createElement("i"),{className:"sep"}))}}
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function draw(){const xs=D.filter(x=>(sel.origem==="Todos"||(sel.origem==="Novos")===x.novo)&&(sel.tipo==="Todos"||x.tipo===sel.tipo)&&(sel.lugar==="Todos"||x.lugar===sel.lugar)&&(sel.grupo==="Todos"||x.grupo===sel.grupo));
document.getElementById("n").textContent=xs.length+" exercícios";
g.innerHTML=xs.map(x=>`<div class="card"><img src="${x.imagens[0]}" data-f='${JSON.stringify(x.imagens)}' alt="${esc(x.nome)}" loading="lazy"><div class="info"><div class="nome">${esc(x.nome)}</div><div class="meta">${esc(x.grupo)} · ${L[x.tipo]}${x.equipamento?" · "+esc(x.equipamento):""}</div><span class="tag ${x.novo?"novo":""}">${x.novo?"novo":"já no app"}</span><span class="tag">${x.lugar}</span><span class="tag">${x.chave}</span></div></div>`).join("")}
let t=0;setInterval(()=>{t^=1;for(const i of g.querySelectorAll("img")){const fs=JSON.parse(i.dataset.f);if(fs[1])i.src=fs[t]}},1200);
bar();draw();
</script></body></html>"""
open(f"{out}/galeria.html", "w", encoding="utf-8").write(page.replace("__DATA__", data))
print(len(items), "itens na galeria")
