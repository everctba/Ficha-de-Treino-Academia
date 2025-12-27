// State Management
const STATE_KEY = 'graci_treino_data_v2';

// Helper for IDs
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let treinoData = {
    aluno: '',
    objetivo: '',
    treinos: [],
    recomendacoes: ''
};

function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        treinoData = JSON.parse(saved);
    } else {
        treinoData.treinos = [createTreino('TREINO A', 'GERAL I')];
    }
    renderEditor();
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(treinoData));
}

function createTreino(titulo = 'TREINO', foco = '') {
    return {
        id: generateUUID(),
        titulo,
        foco,
        exercicios: [createExercicio()]
    };
}

function createExercicio() {
    return {
        id: generateUUID(),
        nome: '',
        series: '3',
        reps: '12',
        carga: ''
    };
}

// Render Editor (App UI)
function renderEditor() {
    const n = document.getElementById('aluno-nome');
    const o = document.getElementById('treino-titulo');
    const r = document.getElementById('recomendacoes');

    if (document.activeElement !== n) n.value = treinoData.aluno;
    if (document.activeElement !== o) o.value = treinoData.objetivo;
    if (document.activeElement !== r) r.value = treinoData.recomendacoes;

    const listContainer = document.getElementById('workouts-list');
    listContainer.innerHTML = '';

    treinoData.treinos.forEach((treino, idx) => {
        const tDiv = document.createElement('div');
        tDiv.innerHTML = `
            <div class="mt-8">
                <div class="flex items-end justify-between border-b border-white/10 pb-4 mb-6">
                    <div class="flex-1 mr-4">
                        <input type="text" 
                            class="bg-transparent text-2xl text-white font-display italic font-bold w-full focus:outline-none focus:border-gra-gold border-b border-transparent placeholder-white/30 focus:ring-0 caret-gra-gold"
                            value="${treino.titulo}" 
                            data-tid="${treino.id}"
                            onchange="updateTreinoHeader(this, 'titulo')"
                            placeholder="Nome do Treino (Ex: TREINO A)"
                        >
                        <input type="text"
                             class="bg-transparent text-sm text-gra-gold uppercase tracking-widest font-medium w-full mt-1 focus:outline-none border-b border-transparent focus:border-gra-gold focus:ring-0 caret-gra-gold transition-colors"
                             value="${treino.foco}"
                             data-tid="${treino.id}"
                             onchange="updateTreinoHeader(this, 'foco')"
                             placeholder="Foco (Ex: Perna)"
                        >
                    </div>
                     <button class="text-gra-text-muted hover:text-red-500 transition-colors p-2" onclick="removeTreino('${treino.id}')" title="Excluir Treino">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>

                <div class="space-y-5" id="ex-list-${treino.id}"></div>

                <button onclick="addExercicio('${treino.id}')" class="mt-4 group relative flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 py-3 text-gra-text-muted transition-all hover:border-gra-gold hover:bg-gra-gold/10 hover:text-white">
                    <span class="material-symbols-outlined text-gra-gold text-lg">add_circle</span>
                    <span class="font-bold uppercase tracking-widest text-[10px]">Add Exercício</span>
                </button>
            </div>
        `;
        listContainer.appendChild(tDiv);

        const exContainer = document.getElementById(`ex-list-${treino.id}`);
        treino.exercicios.forEach((ex, i) => {
            const exDiv = document.createElement('div');
            exDiv.className = "relative bg-gra-dark-gray/50 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 hover:border-gra-gold/30 hover:shadow-[0_0_20px_rgba(197,169,111,0.05)]";
            exDiv.innerHTML = `
                <div class="bg-gradient-to-r from-gra-gray to-gra-dark-gray px-4 py-3 flex justify-between items-center border-b border-white/5">
                    <span class="text-gra-gold font-display font-bold text-sm italic tracking-wide">${String(i + 1).padStart(2, '0')}</span>
                    <button class="text-gra-text-muted hover:text-red-400 transition-colors text-xs" onclick="removeExercicio('${treino.id}', '${ex.id}')">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
                <div class="p-4 space-y-3">
                    <div class="space-y-1">
                        <label class="text-[9px] font-bold uppercase tracking-widest text-gra-text-muted">Movimento</label>
                        <input type="text"
                            class="w-full bg-gra-black border border-white/10 rounded-md text-white py-2 px-3 focus:border-gra-gold focus:outline-none focus:ring-1 focus:ring-gra-gold caret-gra-gold transition-colors text-sm"
                            value="${ex.nome}"
                            placeholder="Nome do exercício..."
                            oninput="updateExercicio('${treino.id}', '${ex.id}', 'nome', this.value)"
                        >
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="bg-black/40 p-2 rounded border border-white/5 text-center">
                            <label class="block text-[8px] font-bold uppercase text-gra-gold mb-1 tracking-wider">Séries</label>
                            <input class="w-full bg-transparent text-center text-sm font-bold text-white p-0 border-none focus:ring-0 focus:border-b focus:border-gra-gold caret-gra-gold" type="text" value="${ex.series}" oninput="updateExercicio('${treino.id}', '${ex.id}', 'series', this.value)">
                        </div>
                        <div class="bg-black/40 p-2 rounded border border-white/5 text-center">
                            <label class="block text-[8px] font-bold uppercase text-gra-gold mb-1 tracking-wider">Reps</label>
                            <input class="w-full bg-transparent text-center text-sm font-bold text-white p-0 border-none focus:ring-0 focus:border-b focus:border-gra-gold caret-gra-gold" type="text" value="${ex.reps}" oninput="updateExercicio('${treino.id}', '${ex.id}', 'reps', this.value)">
                        </div>
                         <div class="bg-black/40 p-2 rounded border border-white/5 text-center">
                            <label class="block text-[8px] font-bold uppercase text-gra-gold mb-1 tracking-wider">Carga</label>
                            <input class="w-full bg-transparent text-center text-sm font-bold text-white p-0 border-none focus:ring-0 focus:border-b focus:border-gra-gold caret-gra-gold" type="text" value="${ex.carga || ''}" placeholder="-" oninput="updateExercicio('${treino.id}', '${ex.id}', 'carga', this.value)">
                        </div>
                    </div>
                </div>
            `;
            exContainer.appendChild(exDiv);
        });
    });

    n.oninput = (e) => { treinoData.aluno = e.target.value; saveState(); };
    o.oninput = (e) => { treinoData.objetivo = e.target.value; saveState(); };
    r.oninput = (e) => { treinoData.recomendacoes = e.target.value; saveState(); };

    // Update Live Preview
    renderPDFTemplate();
}

window.updateTreinoHeader = (el, field) => {
    const tid = el.getAttribute('data-tid');
    const t = treinoData.treinos.find(x => x.id === tid);
    if (t) { t[field] = el.value; saveState(); }
};

window.addTreino = () => {
    treinoData.treinos.push(createTreino());
    saveState();
    renderEditor();
};

window.removeTreino = (id) => {
    if (!confirm("Tem certeza que deseja remover este treino?")) return;
    treinoData.treinos = treinoData.treinos.filter(t => t.id !== id);
    saveState();
    renderEditor();
};

window.addExercicio = (tid) => {
    const t = treinoData.treinos.find(x => x.id === tid);
    if (t) { t.exercicios.push(createExercicio()); saveState(); renderEditor(); }
};

window.removeExercicio = (tid, eid) => {
    const t = treinoData.treinos.find(x => x.id === tid);
    if (t) { t.exercicios = t.exercicios.filter(e => e.id !== eid); saveState(); renderEditor(); }
};

window.updateExercicio = (tid, eid, field, val) => {
    const t = treinoData.treinos.find(x => x.id === tid);
    if (t) {
        const ex = t.exercicios.find(e => e.id === eid);
        if (ex) { ex[field] = val; saveState(); }
    }
};

// DIGITAL PDF GENERATION (Single Page, Custom Height)
document.getElementById('btn-generate-pdf').addEventListener('click', async () => {
    // 1. Ensure Preview is Fresh
    renderPDFTemplate();

    const content = document.getElementById('pdf-content');

    // 2. Measure Header Height (based on visible content)
    // Now we take whatever size is on screen (WYSIWYG)
    const totalHeight = content.scrollHeight;
    const totalWidth = content.offsetWidth;

    // 3. Calculate position of the element to avoid blank PDF
    const rect = content.getBoundingClientRect();

    // 4. Configure PDF to match content EXACTLY
    const opt = {
        margin: 0,
        filename: `Ficha-${(treinoData.aluno || 'Treino').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            // Critical for "blank pdf" fix: Force scroll to top
            scrollY: 0,
            scrollX: 0,
            // Fix for iOS alignment/cutoff issues: Force capture at element origin
            x: 0,
            y: 0,
            height: totalHeight,
            windowWidth: totalWidth, // Match window size to element size exactly
            width: totalWidth
        },
        jsPDF: {
            unit: 'px',
            format: [totalWidth, totalHeight],
            orientation: 'portrait'
        }
    };

    // 4. Save
    html2pdf().set(opt).from(content).save();
});

function renderPDFTemplate() {
    document.getElementById('pdf-title').innerText = "FICHA DE TREINO";
    document.getElementById('pdf-aluno').innerText = (treinoData.aluno || "NOME DO ALUNO");
    document.getElementById('pdf-objetivo').innerText = (treinoData.objetivo || "TREINAMENTO PERSONALIZADO");

    const body = document.getElementById('pdf-body');
    body.innerHTML = '';

    treinoData.treinos.forEach(t => {
        const block = document.createElement('div');
        block.className = 'pdf-workout-block';

        let headerHtml = `
            <div class="pdf-workout-header-row">
                <span class="pdf-workout-title">${t.titulo || 'TREINO'}</span>
                <span class="pdf-workout-focus">${t.foco}</span>
            </div>
            <div class="pdf-exercise-list">
        `;

        let rowsHtml = '';
        t.exercicios.forEach(ex => {
            if (ex.nome) {
                const infoCompl = `${ex.series}X${ex.reps}`;
                rowsHtml += `
                    <div class="pdf-exercise-item">
                        <span class="pdf-ex-name">${ex.nome}</span>
                        <span class="pdf-ex-series">${infoCompl}</span>
                    </div>
                `;
            }
        });

        block.innerHTML = headerHtml + rowsHtml + '</div>';
        body.appendChild(block);
    });

    const recDiv = document.getElementById('pdf-recs');
    if (treinoData.recomendacoes) {
        recDiv.innerText = treinoData.recomendacoes;
        document.querySelector('.pdf-footer').style.display = 'block';
    } else {
        recDiv.innerText = '';
        document.querySelector('.pdf-footer').style.display = 'none';
    }
}

loadState();
