// State Management
const STATE_KEY = 'graci_treino_data';

let treinoData = {
    aluno: '',
    objetivo: '',
    treinos: [], // { id, titulo, foco, exercicios: [{ id, nome, series }] }
    recomendacoes: ''
};

// Initial Data/Load
function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        treinoData = JSON.parse(saved);
    } else {
        // Default init if empty
        treinoData.treinos = [
            createTreino('TREINO A', 'Geral'),
            createTreino('TREINO B', 'Geral')
        ];
    }
    renderEditor();
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(treinoData));
}

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

// Factories
function createTreino(titulo = 'Novo Treino', foco = '') {
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
        series: ''
    };
}

// Render Functions
function renderEditor() {
    // Inputs Globais
    const nomeInput = document.getElementById('aluno-nome');
    const objetivoInput = document.getElementById('treino-titulo');
    const recsInput = document.getElementById('recomendacoes');

    // Avoid overwriting focus if typing, but safe to set on full re-render
    if (document.activeElement !== nomeInput) nomeInput.value = treinoData.aluno;
    if (document.activeElement !== objetivoInput) objetivoInput.value = treinoData.objetivo;
    if (document.activeElement !== recsInput) recsInput.value = treinoData.recomendacoes;

    // Workouts List
    const container = document.getElementById('workouts-list');
    container.innerHTML = '';

    treinoData.treinos.forEach((treino, tIndex) => {
        const tEl = document.createElement('div');
        tEl.className = 'card workout-item';
        tEl.innerHTML = `
            <div class="workout-header">
                <div style="flex:1; display:flex; gap:8px;">
                     <input type="text" class="input-treino-titulo" data-tid="${treino.id}" value="${treino.titulo}" placeholder="Título (Ex: TREINO A)">
                     <input type="text" class="input-treino-foco" data-tid="${treino.id}" value="${treino.foco}" placeholder="Foco (Ex: Pernas)">
                </div>
                <button class="btn-danger-text" onclick="removeTreino('${treino.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="exercise-list" id="list-${treino.id}">
                <!-- Exercicios go here -->
            </div>
            <button class="btn btn-outline full-width" style="margin-top:10px; font-size:0.8rem;" onclick="addExercicio('${treino.id}')">
                <i class="fa-solid fa-plus"></i> Add Exercício
            </button>
        `;

        container.appendChild(tEl);

        const exList = document.getElementById(`list-${treino.id}`);
        treino.exercicios.forEach((ex, eIndex) => {
            const row = document.createElement('div');
            row.className = 'exercise-row';
            row.innerHTML = `
                <input type="text" name="ex-nome" value="${ex.nome}" placeholder="Nome do Exercício" oninput="updateExercicio('${treino.id}', '${ex.id}', 'nome', this.value)">
                <input type="text" name="ex-series" value="${ex.series}" placeholder="Séries/Reps" oninput="updateExercicio('${treino.id}', '${ex.id}', 'series', this.value)">
                <div class="handle-remove" onclick="removeExercicio('${treino.id}', '${ex.id}')">
                    <i class="fa-solid fa-times"></i>
                </div>
            `;
            exList.appendChild(row);
        });
    });

    // Bind Global Inputs Events
    nomeInput.oninput = (e) => { treinoData.aluno = e.target.value; saveState(); };
    objetivoInput.oninput = (e) => { treinoData.objetivo = e.target.value; saveState(); };
    recsInput.oninput = (e) => { treinoData.recomendacoes = e.target.value; saveState(); };

    // Bind Treinos Inputs Events
    document.querySelectorAll('.input-treino-titulo').forEach(inp => {
        inp.oninput = (e) => {
            const t = treinoData.treinos.find(x => x.id === e.target.dataset.tid);
            if (t) { t.titulo = e.target.value; saveState(); }
        };
    });
    document.querySelectorAll('.input-treino-foco').forEach(inp => {
        inp.oninput = (e) => {
            const t = treinoData.treinos.find(x => x.id === e.target.dataset.tid);
            if (t) { t.foco = e.target.value; saveState(); }
        };
    });
}

// Logic Actions
window.addTreino = () => {
    treinoData.treinos.push(createTreino(`TREINO ${String.fromCharCode(65 + treinoData.treinos.length)}`, ''));
    saveState();
    renderEditor();
};

window.removeTreino = (id) => {
    if (!confirm("Remover este treino inteiro?")) return;
    treinoData.treinos = treinoData.treinos.filter(t => t.id !== id);
    saveState();
    renderEditor();
};

window.addExercicio = (treinoId) => {
    const t = treinoData.treinos.find(x => x.id === treinoId);
    if (t) {
        t.exercicios.push(createExercicio());
        saveState();
        renderEditor();
    }
};

window.removeExercicio = (treinoId, exId) => {
    const t = treinoData.treinos.find(x => x.id === treinoId);
    if (t) {
        t.exercicios = t.exercicios.filter(e => e.id !== exId);
        saveState();
        renderEditor();
    }
};

window.updateExercicio = (treinoId, exId, field, val) => {
    const t = treinoData.treinos.find(x => x.id === treinoId);
    if (t) {
        const ex = t.exercicios.find(e => e.id === exId);
        if (ex) {
            ex[field] = val;
            saveState(); // Warning: heavily triggered on input, maybe debounce in production but ok for now
        }
    }
};

// PDF Generation
function renderPDFTemplate() {
    document.getElementById('pdf-title').innerText = "FICHA DE TREINO";
    document.getElementById('pdf-aluno').innerText = treinoData.aluno || "ALUNO(A)";
    document.getElementById('pdf-objetivo').innerText = treinoData.objetivo || "TREINAMENTO PERSONZALIZADO";

    const body = document.getElementById('pdf-body');
    body.innerHTML = '';

    treinoData.treinos.forEach(t => {
        const block = document.createElement('div');
        block.className = 'pdf-workout-block';

        let htmlBuffer = `
            <div>
                <span class="pdf-workout-title">${t.titulo || 'TREINO'}</span>
                <span class="pdf-workout-focus">${t.foco}</span>
            </div>
            <ul class="pdf-exercise-list">
        `;

        t.exercicios.forEach(ex => {
            if (ex.nome) { // Only print if has name
                htmlBuffer += `
                    <li class="pdf-exercise-item">
                        <span class="pdf-ex-name">${ex.nome}</span>
                        <span class="pdf-ex-series">${ex.series}</span>
                    </li>
                `;
            }
        });

        htmlBuffer += `</ul>`;
        block.innerHTML = htmlBuffer;
        body.appendChild(block);
    });

    // Recommendations
    const recDiv = document.getElementById('pdf-recs');
    if (treinoData.recomendacoes) {
        recDiv.className = 'pdf-recs-text';
        recDiv.innerText = treinoData.recomendacoes;
        document.querySelector('.pdf-footer').style.display = 'block';
    } else {
        recDiv.innerText = '';
        document.querySelector('.pdf-footer').style.display = 'none';
    }
}

document.getElementById('btn-add-workout').addEventListener('click', window.addTreino);

document.getElementById('btn-generate-pdf').addEventListener('click', () => {
    // 1. Render data to hidden container
    renderPDFTemplate();

    // 2. Options for html2pdf
    const element = document.getElementById('pdf-content');
    const opt = {
        margin: [10, 10, 10, 10], // mm
        filename: `Ficha_${treinoData.aluno || 'Treino'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // Higher scale for better definition
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 3. Generate
    html2pdf().set(opt).from(element).save();
});

// Start
loadState();
