# Lista curada para a próxima versão.
# tipo: reps = conta repetições (sem carga) · tempo = segura/faz por X segundos/minutos
#       cardio = tempo + distância opcional · alongamento = tempo por lado
# lugar: casa | academia | rua (onde dá para fazer; "casa" também vale para academia)
# equip: o que precisa além do corpo
L = [
  # ---------- Peso do corpo: Peito ----------
  ("flexao_aberta", "Flexão aberta", "Peito", "reps", "casa", "", "Push-Up_Wide"),
  ("flexao_explosiva", "Flexão explosiva (com palma)", "Peito", "reps", "casa", "", "Plyo_Push-up"),
  ("flexao_um_braco", "Flexão com um braço", "Peito", "reps", "casa", "", "Single-Arm_Push-Up"),
  ("flexao_rotacao", "Flexão com rotação (T)", "Peito", "reps", "casa", "", "Push_Up_to_Side_Plank"),
  ("flexao_inclinada_fechada", "Flexão inclinada pegada fechada", "Peito", "reps", "casa", "banco ou sofá", "Incline_Push-Up_Close-Grip"),
  ("flexao_suspensa", "Flexão na fita (TRX)", "Peito", "reps", "casa", "fita de suspensão", "Suspended_Push-Up"),
  # ---------- Ombros ----------
  ("flexao_parada_mao", "Flexão em parada de mão", "Ombros", "reps", "casa", "parede", "Handstand_Push-Ups"),
  ("circulo_bracos", "Círculos com os braços", "Ombros", "tempo", "casa", "", "Arm_Circles"),
  # ---------- Costas ----------
  ("barra_escapular", "Barra escapular", "Costas", "reps", "casa", "barra", "Scapular_Pull-Up"),
  ("barra_elastico", "Barra fixa com elástico", "Costas", "reps", "casa", "barra + elástico", "Band_Assisted_Pull-Up"),
  ("muscle_up", "Muscle-up", "Costas", "reps", "rua", "barra", "Muscle_Up"),
  ("remada_suspensa", "Remada na fita (TRX)", "Costas", "reps", "casa", "fita de suspensão", "Suspended_Row"),
  ("superman", "Superman", "Costas", "reps", "casa", "", "Superman"),
  ("extensao_lombar_chao", "Extensão lombar no chão", "Costas", "reps", "casa", "", "Hyperextensions_With_No_Hyperextension_Bench"),
  # ---------- Tríceps ----------
  ("triceps_toalha", "Tríceps com toalha", "Tríceps", "reps", "casa", "toalha", "Standing_Towel_Triceps_Extension"),
  ("triceps_corpo", "Tríceps testa no corpo (na barra baixa)", "Tríceps", "reps", "casa", "barra baixa ou mesa", "Body_Tricep_Press"),
  # ---------- Pernas ----------
  ("afundo_caminhando_corpo", "Afundo caminhando sem peso", "Pernas", "reps", "casa", "", "Bodyweight_Walking_Lunge"),
  ("agachamento_salto", "Agachamento com salto", "Pernas", "reps", "casa", "", "Freehand_Jump_Squat"),
  ("afundo_salto", "Afundo com salto", "Pernas", "reps", "casa", "", "Split_Jump"),
  ("flexora_nordica", "Flexora nórdica", "Pernas", "reps", "casa", "apoio para os pés", "Natural_Glute_Ham_Raise"),
  ("agachamento_unilateral_banco", "Agachamento unilateral no banco", "Pernas", "reps", "casa", "banco ou cadeira", "Single-Leg_High_Box_Squat"),
  ("subida_banco_joelho", "Subida no banco com joelho alto", "Pernas", "reps", "casa", "banco ou degrau", "Step-up_with_Knee_Raise"),
  ("agachamento_elastico", "Agachamento com elástico", "Pernas", "reps", "casa", "elástico", "Squats_-_With_Bands"),
  # ---------- Glúteos ----------
  ("ponte_gluteo_chao", "Ponte de glúteo no chão", "Glúteos", "reps", "casa", "", "Butt_Lift_Bridge"),
  ("abducao_em_pe", "Abdução de quadril em pé", "Glúteos", "reps", "casa", "cadeira para apoio", "Side_Leg_Raises"),
  ("ponte_bola", "Ponte de glúteo na bola", "Glúteos", "reps", "casa", "bola suíça", "Physioball_Hip_Bridge"),
  ("flexora_bola", "Flexora na bola", "Glúteos", "reps", "casa", "bola suíça", "Ball_Leg_Curl"),
  # ---------- Abdômen ----------
  ("abdominal_bicicleta", "Abdominal bicicleta", "Abdômen", "reps", "casa", "", "Air_Bike"),
  ("toque_calcanhar", "Toque no calcanhar", "Abdômen", "reps", "casa", "", "Alternate_Heel_Touchers"),
  ("abdominal_cruzado", "Abdominal cruzado", "Abdômen", "reps", "casa", "", "Cross-Body_Crunch"),
  ("canivete", "Abdominal canivete", "Abdômen", "reps", "casa", "", "Jackknife_Sit-Up"),
  ("abdominal_remador", "Abdominal remador", "Abdômen", "reps", "casa", "", "Seated_Leg_Tucks"),
  ("tesoura", "Tesoura (batida de pernas)", "Abdômen", "tempo", "casa", "", "Flutter_Kicks"),
  ("tesoura_cruzada", "Tesoura cruzada", "Abdômen", "tempo", "casa", "", "Scissor_Kick"),
  ("toque_pes", "Abdominal com toque nos pés", "Abdômen", "reps", "casa", "", "Toe_Touchers"),
  ("escalador", "Escalador (mountain climber)", "Abdômen", "tempo", "casa", "", "Mountain_Climbers"),
  ("prancha_elevacao_quadril", "Prancha com elevação de quadril", "Abdômen", "reps", "casa", "", "Butt-Ups"),
  ("vacuo", "Vácuo abdominal", "Abdômen", "tempo", "casa", "", "Stomach_Vacuum"),
  ("abdominal_bola", "Abdominal na bola", "Abdômen", "reps", "casa", "bola suíça", "Exercise_Ball_Crunch"),
  ("elevacao_joelhos_paralela", "Elevação de joelhos nas paralelas", "Abdômen", "reps", "rua", "paralelas", "Knee_Hip_Raise_On_Parallel_Bars"),
  # ---------- Condicionamento / pliometria ----------
  ("polichinelo_estrela", "Salto estrela", "Condicionamento", "reps", "casa", "", "Star_Jump"),
  ("salto_grupado", "Salto grupado (joelhos no peito)", "Condicionamento", "reps", "casa", "", "Knee_Tuck_Jump"),
  ("skipping", "Skipping (corrida parada)", "Condicionamento", "tempo", "casa", "", "Fast_Skipping"),
  ("calcanhar_gluteo", "Calcanhar no glúteo", "Condicionamento", "tempo", "casa", "", "Double_Leg_Butt_Kick"),
  ("salto_foguete", "Salto foguete", "Condicionamento", "reps", "casa", "", "Rocket_Jump"),
  ("salto_tesoura", "Salto tesoura", "Condicionamento", "reps", "casa", "", "Scissors_Jump"),
  ("salto_distancia", "Salto em distância parado", "Condicionamento", "reps", "rua", "", "Standing_Long_Jump"),
  ("salto_lateral", "Salto lateral (patinador)", "Condicionamento", "reps", "casa", "", "Lateral_Bound"),
  ("salto_caixa", "Salto na caixa", "Condicionamento", "reps", "academia", "caixa ou banco firme", "Front_Box_Jump"),
  ("salto_banco", "Salto sobre o banco", "Condicionamento", "reps", "academia", "banco", "Bench_Jump"),
  ("lagarta", "Lagarta (inchworm)", "Condicionamento", "reps", "casa", "", "Inchworm"),
  ("corda_naval", "Corda naval", "Condicionamento", "tempo", "academia", "corda naval", "Battling_Ropes"),
  ("marreta_pneu", "Marretada no pneu", "Condicionamento", "reps", "academia", "marreta + pneu", "Sledgehammer_Swings"),
  # ---------- Cardio ----------
  ("corrida_rua", "Corrida / caminhada na rua", "Cardio", "cardio", "rua", "", "Trail_Running_Walking"),
  ("corrida_esteira", "Corrida na esteira", "Cardio", "cardio", "academia", "esteira", "Running_Treadmill"),
  ("caminhada_esteira", "Caminhada na esteira", "Cardio", "cardio", "academia", "esteira", "Walking_Treadmill"),
  ("bike_ergometrica", "Bicicleta ergométrica", "Cardio", "cardio", "academia", "bike ergométrica", "Bicycling_Stationary"),
  ("bike_horizontal", "Bicicleta horizontal", "Cardio", "cardio", "academia", "bike horizontal", "Recumbent_Bike"),
  ("eliptico", "Elíptico (transport)", "Cardio", "cardio", "academia", "elíptico", "Elliptical_Trainer"),
  ("remo_ergometro", "Remo ergômetro", "Cardio", "cardio", "academia", "remo", "Rowing_Stationary"),
  ("escada", "Escada (simulador)", "Cardio", "cardio", "academia", "simulador de escada", "Stairmaster"),
  ("pular_corda", "Pular corda", "Cardio", "cardio", "casa", "corda", "Rope_Jumping"),
  ("patins", "Patins", "Cardio", "cardio", "rua", "patins", "Skating"),
  # ---------- Alongamento e mobilidade ----------
  ("alongamento_maior_do_mundo", "Alongamento \"maior do mundo\"", "Alongamento", "alongamento", "casa", "", "Worlds_Greatest_Stretch"),
  ("postura_crianca", "Postura da criança", "Alongamento", "alongamento", "casa", "", "Childs_Pose"),
  ("gato", "Gato (mobilidade da coluna)", "Alongamento", "alongamento", "casa", "", "Cat_Stretch"),
  ("joelhos_peito", "Abraçar os joelhos", "Alongamento", "alongamento", "casa", "", "Hug_Knees_To_Chest"),
  ("posterior_sentado", "Posterior de coxa sentado", "Alongamento", "alongamento", "casa", "", "Seated_Floor_Hamstring_Stretch"),
  ("flexor_quadril", "Flexor do quadril ajoelhado", "Alongamento", "alongamento", "casa", "", "Kneeling_Hip_Flexor"),
  ("quadriceps_em_pe", "Quadríceps em pé", "Alongamento", "alongamento", "casa", "", "Quad_Stretch"),
  ("panturrilha_parede", "Panturrilha na parede", "Alongamento", "alongamento", "casa", "parede", "Calf_Stretch_Hands_Against_Wall"),
  ("piriforme", "Glúteo / piriforme (tornozelo no joelho)", "Alongamento", "alongamento", "casa", "", "Ankle_On_The_Knee"),
  ("borboleta", "Adutores (borboleta)", "Alongamento", "alongamento", "casa", "", "Adductor_Groin"),
  ("torcao_coluna", "Torção da coluna", "Alongamento", "alongamento", "casa", "", "Spinal_Stretch"),
  ("peito_ombro", "Peito e ombro com bastão", "Alongamento", "alongamento", "casa", "bastão ou cabo de vassoura", "Chest_And_Front_Of_Shoulder_Stretch"),
  ("ombro_cruzado", "Ombro (braço cruzado)", "Alongamento", "alongamento", "casa", "", "Shoulder_Stretch"),
  ("triceps_alongamento", "Tríceps atrás da cabeça", "Alongamento", "alongamento", "casa", "", "Triceps_Stretch"),
  ("pescoco_lateral", "Pescoço lateral", "Alongamento", "alongamento", "casa", "", "Side_Neck_Stretch"),
  ("rolo_quadriceps", "Rolo no quadríceps", "Alongamento", "alongamento", "casa", "rolo de liberação", "Quadriceps-SMR"),
  ("rolo_panturrilha", "Rolo na panturrilha", "Alongamento", "alongamento", "casa", "rolo de liberação", "Calves-SMR"),
  ("rolo_trato_iliotibial", "Rolo na lateral da coxa", "Alongamento", "alongamento", "casa", "rolo de liberação", "Iliotibial_Tract-SMR"),
]

# Onde a 1ª foto é só a posição de partida, a 2ª vira a principal.
FOTO_2_PRINCIPAL = {"patins", "ombro_cruzado", "triceps_alongamento", "pescoco_lateral", "polichinelo_estrela",
                    "salto_foguete", "peito_ombro", "abducao_em_pe"}
