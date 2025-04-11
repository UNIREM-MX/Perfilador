document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const preguntasContainer = document.getElementById('preguntas-container');
    const form = document.getElementById('vocational-test');
    const submitButton = document.getElementById('submit-button');
    const resultadoDiv = document.getElementById('resultado');
    const progressBarInner = document.getElementById('progress-bar');
    const progressContainer = progressBarInner ? progressBarInner.parentElement : null;
    const progressText = document.getElementById('progress-text');
    const contactSection = document.getElementById('contact-section');
    const contactForm = document.getElementById('contact-form');
    const hiddenCareerInput = document.getElementById('hidden-career-interest');
    const formStatus = document.getElementById('form-status-message');
    const shareButtonContainer = document.getElementById('share-button-container');

    // ID para el contenedor de la lista de habilidades (generado DENTRO de #resultado)
    const skillPercentageListContainerId = 'skill-list-area-dynamic'; // ID único

    // --- Configuración ---
    const CONFIG = {
        googleAppScriptUrl: 'https://script.google.com/macros/s/AKfycbyiwMWpW2ha7bXH-N2jwqx8uvylYRGrgOZ_ykn34RF9INl343XNRa0Gm9Hz8A7cL8SKCQ/exec',
        carrerasDataFile: './carreras.json',
        placeholderGASUrl: 'AQUI_VA_LA_URL'
    };

    // --- Global variables ---
    let totalPreguntas = 0;
    let lastMilestoneReached = 0;
    let testStarted = false;
    let carrerasData = null;

    // --- Definición de Habilidades (CON DESCRIPCIONES COMPLETAS) ---
    const HABILIDADES_DEFINICIONES = {
        analitico: { label: "Análisis - Lógica", maxScore: 0, descripcion: "Capacidad para descomponer problemas complejos, usar la lógica y el razonamiento, identificar patrones y trabajar con datos de manera estructurada." },
        creativo: { label: "Creatividad - Expresión Artística", maxScore: 0, descripcion: "Habilidad para generar ideas originales, expresarse a través de formas artísticas (visual, escrita, musical), pensar de forma no convencional y encontrar soluciones innovadoras." },
        social: { label: "Interacción - Comunicación", maxScore: 0, descripcion: "Facilidad para interactuar con otros, comunicar ideas de forma clara (oral y escrita), persuadir, colaborar en equipo y establecer relaciones interpersonales." },
        tecnico: { label: "Técnica - Práctica", maxScore: 0, descripcion: "Destreza en el manejo de herramientas, maquinaria, software o procedimientos específicos. Interés por el funcionamiento de las cosas y la aplicación práctica del conocimiento." },
        organizativo: { label: "Organización - Gestión", maxScore: 0, descripcion: "Capacidad para planificar, establecer prioridades, gestionar recursos (tiempo, personas, materiales), coordinar tareas y mantener el orden y la eficiencia." },
        investigativo: { label: "Investigación - Curiosidad", maxScore: 0, descripcion: "Interés por explorar, indagar, hacer preguntas, buscar información, experimentar y descubrir nuevo conocimiento. Disfrute por el aprendizaje autónomo." },
        empatico: { label: "Empatía - Apoyo Asistencial", maxScore: 0, descripcion: "Habilidad para comprender y compartir los sentimientos de los demás, mostrar sensibilidad hacia sus necesidades y tener vocación de ayuda, cuidado o servicio." }
    };

    // --- Helper Function: Shuffle Array ---
    function shuffleArray(array) { /* ... (sin cambios) ... */ for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;}

    // --- Function: Display Error Message ---
    function displayError(element, message) { /* ... (sin cambios, usa clase .error-message en #resultado) ... */ if(!element){console.error("No target for error:",message);return;} const isResultError=(element.id==='resultado'); element.innerHTML=`<p class="${isResultError?'error-message':''}" style="${!isResultError?'color:red; text-align:center; padding:10px; border:1px dashed red;':''}">${message}</p>`; if(element.id==='resultado'||element.id==='preguntas-container'){element.classList.add('visible');} if(element.id!=='preguntas-container'){element.scrollIntoView({behavior:'smooth',block:'center'});}}

    // --- Function: Calcular Máximos Puntajes por Habilidad ---
    function calcularMaxScoresHabilidades() { /* ... (sin cambios) ... */ for(const h in HABILIDADES_DEFINICIONES){if(HABILIDADES_DEFINICIONES.hasOwnProperty(h)){HABILIDADES_DEFINICIONES[h].maxScore=0;}} if(!carrerasData){console.error("No career data.");return;} for(const idC in carrerasData){if(carrerasData.hasOwnProperty(idC)&&Array.isArray(carrerasData[idC].preguntas)){carrerasData[idC].preguntas.forEach(p=>{if(p&&p.habilidad&&HABILIDADES_DEFINICIONES[p.habilidad]){HABILIDADES_DEFINICIONES[p.habilidad].maxScore+=3;}});}} console.log("Max scores:",HABILIDADES_DEFINICIONES);}

    // --- Function: Render Shuffled Questions ---
    function renderizarPreguntasAleatorias() { /* ... (sin cambios, usa data-question-ref) ... */ if(!carrerasData||!preguntasContainer){displayError(preguntasContainer||document.body,"Error cargando preguntas.");return;} let qList=[];totalPreguntas=0; for(const idC in carrerasData){if(carrerasData.hasOwnProperty(idC)&&Array.isArray(carrerasData[idC].preguntas)){carrerasData[idC].preguntas.forEach((p,i)=>{if(p&&p.texto&&p.habilidad&&HABILIDADES_DEFINICIONES[p.habilidad]){qList.push({id:`${idC}-q${i}`,texto:p.texto,habilidad:p.habilidad,idCarrera:idC});totalPreguntas++;}else{console.warn(`Pregunta ${i} de ${idC} inválida.`);}});}} if(totalPreguntas===0){displayError(preguntasContainer,"No hay preguntas.");if(submitButton)submitButton.style.display='none';if(progressContainer)progressContainer.style.display='none';return;} if(submitButton)submitButton.style.display='block';if(progressContainer)progressContainer.style.display='block'; qList=shuffleArray(qList); let html=''; qList.forEach((pData,dIndex)=>{const genOpt=(v,t)=>`<label><input type="radio" name="${pData.id}" value="${v}" required data-habilidad="${pData.habilidad}"><span>${v}: ${t}</span></label>`; html+=`<div class="question" data-question-ref="${pData.id}"><p><span class="question-number">${dIndex+1}.</span> ${pData.texto}</p><div class="options">${genOpt(1,"No me interesa")}${genOpt(2,"Podría interesarme")}${genOpt(3,"Me interesa")}</div></div>`;}); preguntasContainer.innerHTML=html; updateProgressBar();lastMilestoneReached=0;testStarted=false;}

    // --- Function: Update Progress Bar & Track GA Progress ---
    function updateProgressBar() { /* ... (sin cambios) ... */ if(!form||!progressContainer||!progressBarInner||!progressText||totalPreguntas===0)return; const ans=new Set(Array.from(form.querySelectorAll('input[type="radio"]:checked')).map(r=>r.name)); const sel=ans.size;const perc=Math.round((sel/totalPreguntas)*100); if(typeof gtag!=='undefined'){if(!testStarted&&sel>0){testStarted=true;try{gtag('event','test_start',{/*...*/});}catch(e){console.error("GA Error",e);}} const mS=[25,50,75,100];for(const m of mS){if(perc>=m&&lastMilestoneReached<m){try{gtag('event','test_progress',{/*...*/});}catch(e){console.error("GA Error",e);}lastMilestoneReached=m;}} if(sel===0){lastMilestoneReached=0;testStarted=false;}} progressBarInner.style.width=`${perc}%`; progressText.textContent=`${perc}% completado`; progressContainer.setAttribute('aria-valuenow',perc);}

    // --- Function: Generate HTML List Items with Inline Descriptions ---
    function generarListaPorcentajes(puntajesNormalizados) {
        const container = resultadoDiv.querySelector(`#${skillPercentageListContainerId}`); // Busca DENTRO de #resultado
        if (!container) { console.error(`Contenedor #${skillPercentageListContainerId} no encontrado.`); return; }
        container.innerHTML = ''; // Limpiar

        const listElement = document.createElement('ul');
        listElement.className = 'skill-percentage-list';
        listElement.setAttribute('aria-label', 'Detalle de porcentajes por habilidad');
        container.appendChild(listElement);

        const sortedHabilidades = Object.entries(puntajesNormalizados)
            .map(([key, percentage]) => ({ key, percentage, label: HABILIDADES_DEFINICIONES[key]?.label || key, desc: HABILIDADES_DEFINICIONES[key]?.descripcion || 'Descripción no disponible.' }))
            .sort((a, b) => b.percentage - a.percentage);

        if (sortedHabilidades.length > 0) {
            sortedHabilidades.forEach(item => {
                const wrapper = document.createElement('div');
                wrapper.className = 'skill-item-wrapper';

                const listItem = document.createElement('li');
                listItem.className = 'skill-percentage-list-item skill-item-clickable';
                listItem.dataset.skillKey = item.key;
                listItem.setAttribute('role', 'button');
                listItem.setAttribute('tabindex', '0');
                listItem.setAttribute('aria-expanded', 'false');
                listItem.innerHTML = `<strong>${item.label}:</strong> <span>${item.percentage}%</span>`;

                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'skill-description-inline';
                descriptionDiv.setAttribute('aria-hidden', 'true');
                descriptionDiv.innerHTML = `<p>${item.desc}</p>`;

                wrapper.appendChild(listItem);
                wrapper.appendChild(descriptionDiv);
                listElement.appendChild(wrapper);
            });
        } else {
            listElement.innerHTML = '<div class="skill-item-wrapper"><li style="cursor:default; padding: 10px 15px;">No hay datos de habilidades disponibles.</li></div>';
        }
    }

    // --- Function: Show/Hide Inline Skill Description ---
    function mostrarDescripcionHabilidadInline(clickedLiElement) {
        if (!clickedLiElement) return;
        const wrapper = clickedLiElement.closest('.skill-item-wrapper');
        if (!wrapper) return;
        const descriptionDiv = wrapper.querySelector('.skill-description-inline');
        if (!descriptionDiv) return;

        const isVisible = descriptionDiv.classList.contains('visible');

        // Ocultar todas las demás descripciones y desactivar LIs
        const allWrappers = resultadoDiv.querySelectorAll(`#${skillPercentageListContainerId} .skill-item-wrapper`);
        allWrappers.forEach(w => {
            const desc = w.querySelector('.skill-description-inline');
            const li = w.querySelector('.skill-percentage-list-item');
            // Ocultar descripción y desactivar LI si NO es el que se clickeó
            if (w !== wrapper && desc && li) {
                desc.classList.remove('visible');
                desc.setAttribute('aria-hidden', 'true');
                li.classList.remove('skill-item-active');
                li.setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle (mostrar/ocultar) la descripción del LI clickeado
        if (!isVisible) {
            descriptionDiv.classList.add('visible');
            descriptionDiv.setAttribute('aria-hidden', 'false');
            clickedLiElement.classList.add('skill-item-active');
            clickedLiElement.setAttribute('aria-expanded', 'true');
            // Opcional: Scroll suave para asegurar visibilidad si la lista es muy larga
            // setTimeout(() => { // Delay para permitir renderizado
            //    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // }, 100); // 100ms delay
        } else {
            descriptionDiv.classList.remove('visible');
            descriptionDiv.setAttribute('aria-hidden', 'true');
            clickedLiElement.classList.remove('skill-item-active');
            clickedLiElement.setAttribute('aria-expanded', 'false');
        }
    }

    // --- Function: Calculate and Display Results (UNIFICADO + Validación + Subsecciones) ---
    function calcularResultado() {
        // Limpiar resaltado previo
        form.querySelectorAll('.question-unanswered').forEach(q => q.classList.remove('question-unanswered'));

        // Validaciones iniciales
        if (!form || !resultadoDiv || !contactSection || !carrerasData || !shareButtonContainer) {
             if(resultadoDiv) displayError(resultadoDiv, "Error inesperado."); return;
        }

        // Limpiar secciones
        resultadoDiv.innerHTML = ''; resultadoDiv.classList.remove('visible');
        shareButtonContainer.innerHTML = ''; contactSection.classList.remove('visible');

        // Inicializar puntajes
        const puntajes = {}; const puntajesHabilidades = {};
        for (const idC in carrerasData) { if (carrerasData.hasOwnProperty(idC)) { puntajes[idC] = 0; }}
        for (const h in HABILIDADES_DEFINICIONES) { if (HABILIDADES_DEFINICIONES.hasOwnProperty(h)) { puntajesHabilidades[h] = 0; }}

        // Validar respuestas y encontrar la primera faltante
        const respuestas = form.querySelectorAll('input[type="radio"]:checked');
        const answeredNames = new Set(respuestas.length > 0 ? Array.from(respuestas).map(r => r.name) : []);
        let firstUnansweredDiv = null;
        if (totalPreguntas > 0) {
            const allQuestionDivs = form.querySelectorAll('.question');
            for (const questionDiv of allQuestionDivs) {
                const questionId = questionDiv.dataset.questionRef; // Usar el ID guardado
                if (questionId && !answeredNames.has(questionId)) { // Si no está en el Set de respondidas
                    firstUnansweredDiv = questionDiv;
                    break;
                }
            }
        }

        // Si faltan respuestas (y hay preguntas en total)
        if (totalPreguntas > 0 && firstUnansweredDiv) {
            displayError(resultadoDiv, `Por favor, responde todas las ${totalPreguntas} preguntas. Falta responder la pregunta resaltada.`);
            contactSection.classList.remove('visible');
            firstUnansweredDiv.classList.add('question-unanswered');
            firstUnansweredDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return; // Detener
        }
        if (totalPreguntas === 0) { displayError(resultadoDiv, "No hay preguntas."); return; }

        // Sumar puntajes (sin cambios)
        respuestas.forEach(input => { const n=input.name; const idC=n.split('-')[0]; const v=parseInt(input.value,10)||0; if(puntajes.hasOwnProperty(idC)){puntajes[idC]+=v;} const h=input.dataset.habilidad; if(h&&puntajesHabilidades.hasOwnProperty(h)){puntajesHabilidades[h]+=v;} else if(h){console.warn(`Hab '${h}' no definida.`);} });

        // Calcular Mejores Carreras (sin cambios)
        let pArray = Object.entries(puntajes).map(([id,s])=>({id,s})).filter(c=>carrerasData[c.id]?.preguntas?.length>0).sort((a,b)=>b.s-a.s);
        let topIds = []; let maxScore = -1; if(pArray.length>0){maxScore=pArray[0].s; const cMax=pArray.filter(c=>c.s===maxScore); topIds=cMax.slice(0,2).map(c=>c.id);}

        // Normalizar Habilidades (sin cambios)
        const pNorm = {}; let hasSkills = false;
        for(const h in puntajesHabilidades){if(HABILIDADES_DEFINICIONES.hasOwnProperty(h)){const sB=puntajesHabilidades[h];const maxS=HABILIDADES_DEFINICIONES[h].maxScore; if(maxS>0){pNorm[h]=Math.round((sB/maxS)*100); hasSkills=true;}else{pNorm[h]=0;}}}
        console.log("Puntajes Normalizados:", pNorm);

        // --- Preparar y Mostrar Resultados UNIFICADOS con Subsecciones ---
        if (topIds.length > 0) {
            const resultNames = topIds.map(id => carrerasData[id]?.nombreDisplay || 'N/A').join(' | ');
            let maxP = carrerasData[topIds[0]]?.preguntas?.length * 3 || 0;

            // --- Construir HTML para #resultado ---
            let resultadoHTML = '';

            // Sección 1: Carreras
            resultadoHTML += `<div class="result-section result-section-careers">`;
            resultadoHTML += `<h3 class="result-title">Resultado: Tu Carrera Ideal</h3>`;
            resultadoHTML += `<p class="result-intro-text">Basado en tus respuestas:</p>`; // Intro más simple
            // Añadir puntaje
             resultadoHTML += `<p class="result-score">Puntaje de Afinidad: <span class="result-score-value">${maxScore} / ${maxP}</span></p>`;

            if (topIds.length === 1) {
                 const id = topIds[0]; const c = carrerasData[id];
                 resultadoHTML += `<h4 class="career-single-name"><a href="${c?.url||'#'}" target="_blank" rel="noreferrer">${c?.nombreDisplay||id}</a></h4>
                                   <p class="career-single-description">${c?.descripcion||''}</p>`;
            } else {
                 const c1 = carrerasData[topIds[0]]; const c2 = carrerasData[topIds[1]];
                 resultadoHTML += `<p class="result-intro-text" style="margin-top:-15px; margin-bottom: 15px;">Muestras afinidad destacada con:</p>
                                   <ul class="career-list">`;
                 [c1, c2].forEach(c => { if(c) resultadoHTML += `<li class="career-list-item"><strong class="career-name-in-list"><a href="${c.url||'#'}" target="_blank" rel="noreferrer">${c.nombreDisplay}</a></strong> <span class="career-description-in-list">${c.descripcion||''}</span></li>`; });
                 resultadoHTML += `</ul>`;
            }
             resultadoHTML += `<p class="result-disclaimer"><em>Recuerda que este test es una guía. Investiga más y habla con orientadores.</em></p>`;
            resultadoHTML += `</div>`; // Cierra wrapper carreras

            // Sección 2: Habilidades (si hay datos)
            if (hasSkills) {
                resultadoHTML += `<div class="result-section result-section-skills">`;
                resultadoHTML += `<h3 class="skills-title-in-result">Tu Perfil Detallado de Habilidades</h3>`;
                resultadoHTML += `<p class="skills-description-in-result">Haz clic en cada habilidad para leer su descripción:</p>`;
                resultadoHTML += `<div id="${skillPercentageListContainerId}"></div>`; // Contenedor para la lista UL
                resultadoHTML += `</div>`;
            } else {
                resultadoHTML += `<div class="result-section result-section-skills"><p class="error-message">No se pudo generar el perfil de habilidades.</p></div>`;
            }

            // --- Poblar #resultado y hacerlo visible ---
            resultadoDiv.innerHTML = resultadoHTML;
            resultadoDiv.classList.add('visible');

            // --- Generar Lista de Habilidades (SI APLICA y DESPUÉS de insertar HTML) ---
            if (hasSkills) {
                 generarListaPorcentajes(pNorm); // Llama a la función que crea los wrappers, LI y DIVs de descripción
            }

            // --- Generar y colocar Botón WhatsApp ---
            const whatsappSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: middle; margin-right: 8px;"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;
            const shareBtnHTML = `<button type="button" id="share-whatsapp-button" class="button button-pill share-button">${whatsappSVG}Compartir Resultado</button>`;
            shareButtonContainer.innerHTML = shareBtnHTML;
            const shareBtn = shareButtonContainer.querySelector('#share-whatsapp-button');
            if (shareBtn) shareBtn.onclick = () => compartirWhatsApp(topIds);

            // --- Mostrar Contacto ---
             if (contactSection && hiddenCareerInput) {
                 hiddenCareerInput.value = resultNames; contactSection.classList.add('visible');
             }

            // --- Scroll ---
            const resTitle = resultadoDiv.querySelector('.result-title');
            if (resTitle) resTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // --- GA Event ---
            if (typeof gtag !== 'undefined') { try { gtag('event', 'test_complete', { /*...*/ 'result_careers':resultNames }); } catch(e){ console.error("GA Error", e); } }

        } else {
            displayError(resultadoDiv, "No se pudo determinar un resultado claro...");
            contactSection.classList.remove('visible');
        }
    }


// --- Function: Share Results on WhatsApp (MODIFICADA) ---
function compartirWhatsApp(careerIds) {
    // Validar datos necesarios
    if (!carrerasData || !Array.isArray(careerIds) || careerIds.length === 0) {
        console.error("No se pueden compartir resultados: faltan datos o IDs.");
        // Podrías añadir aquí una alerta para el usuario si lo deseas
        // alert("Hubo un problema al intentar compartir el resultado.");
        return;
    }

    // Variables para los mensajes y datos dinámicos
    let messageText = '';
    const testLink = window.location.href; // Enlace a la página actual del test
    const uniremInfo = `---
*UNIREM*
Síguenos: @UNIREM.MX (FB/IG/TikTok)
Contacto:  5550370100 |  WA: 5546190122`; // Información de contacto fija

    // Construir el mensaje según si es 1 o 2 resultados
    if (careerIds.length === 1) {
        // Mensaje para resultado único
        const careerId = careerIds[0];
        const careerName = carrerasData[careerId]?.nombreDisplay || 'una carrera interesante'; // Nombre de la carrera

        // Usar template literals (backticks ``)
        messageText = `¡Hice el test vocacional de UNIREM! 🎓

Mi perfil muestra una *fuerte inclinación* hacia:
 *${careerName}* 

*¡Descubre tu vocación también!*
${testLink}

${uniremInfo}`; // Añadir info de UNIREM

    } else {
        // Mensaje para resultado doble (empate)
        const careerName1 = carrerasData[careerIds[0]]?.nombreDisplay || 'un área';
        const careerName2 = carrerasData[careerIds[1]]?.nombreDisplay || 'otra área';

        // Usar template literals (backticks ``)
        messageText = `¡Hice el test vocacional de UNIREM! 

Muestro *interés destacado* en estas áreas:
• *${careerName1}*
• *${careerName2}*

*¡Descubre tu vocación también!* 
${testLink}

${uniremInfo}`; // Añadir info de UNIREM
    }

    // Crear la URL de WhatsApp codificando el mensaje correctamente
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    // Abrir WhatsApp en una nueva pestaña/ventana
    window.open(whatsappUrl, '_blank');

    // Enviar Evento GA de Compartir (si está configurado)
    if (typeof gtag !== 'undefined') {
        try {
            gtag('event', 'share', {
                'method': 'WhatsApp',
                'content_type': 'Vocational Test Result',
                'content_id': careerIds.join(',') // IDs de las carreras compartidas
            });
            console.log("GA Event: share - WhatsApp");
        } catch(gaError){
            console.error("Error enviando GA 'share':", gaError);
        }
    }
}
    // --- Function: Handle Contact Form Submission ---
    async function handleContactFormSubmit(event) { /* ... (sin cambios) ... */ event.preventDefault();if(!contactForm||!formStatus)return;const btn=contactForm.querySelector('#contact-submit-button');const txt=btn?btn.textContent:'Enviar';if(btn){btn.disabled=true;btn.textContent='Enviando...';}formStatus.classList.remove('visible','success','error');const fData=new FormData(contactForm);const data=Object.fromEntries(fData.entries());if(!CONFIG.googleAppScriptUrl||CONFIG.googleAppScriptUrl===CONFIG.placeholderGASUrl){console.error('GAS URL missing');formStatus.textContent='Error config.';formStatus.className='form-status visible error';if(btn){btn.disabled=false;btn.textContent=txt;}return;}try{await fetch(CONFIG.googleAppScriptUrl,{method:'POST',mode:'no-cors',body:JSON.stringify(data)});formStatus.textContent='¡Gracias!';formStatus.className='form-status visible success';contactForm.reset();if(typeof gtag!=='undefined'){try{gtag('event','generate_lead',{/*...*/});}catch(e){console.error("GA Error",e);}}}catch(error){console.error('Error submit:',error);formStatus.textContent='Error al enviar.';formStatus.className='form-status visible error';}finally{if(btn){btn.disabled=false;btn.textContent=txt;}}}

     // --- Event Listener para Habilidades (Delegado en #resultado) ---
     if (resultadoDiv) {
         // Click
         resultadoDiv.addEventListener('click', (event) => {
             const listItem = event.target.closest(`#${skillPercentageListContainerId} .skill-item-clickable`);
             if (listItem) { mostrarDescripcionHabilidadInline(listItem); } // Llama a la nueva función inline
         });
         // Keydown
         resultadoDiv.addEventListener('keydown', (event) => {
              const listItem = event.target.closest(`#${skillPercentageListContainerId} .skill-item-clickable`);
              if (listItem && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); mostrarDescripcionHabilidadInline(listItem); }
         });
     } else { console.error("#resultado div not found."); }

    // --- Function: Load Initial Data and Setup ---
    async function initializeTest() { /* ... (sin cambios) ... */ if(resultadoDiv)resultadoDiv.classList.remove('visible');if(shareButtonContainer)shareButtonContainer.innerHTML='';if(contactSection)contactSection.classList.remove('visible');if(formStatus)formStatus.classList.remove('visible'); try {console.log(`Cargando: ${CONFIG.carrerasDataFile}`);const r=await fetch(CONFIG.carrerasDataFile);if(!r.ok)throw new Error(`Fetch failed: ${r.status}`);carrerasData=await r.json();if(!carrerasData||typeof carrerasData!=='object'||Object.keys(carrerasData).length===0)throw new Error("JSON inválido.");console.log("Datos ok:",carrerasData);calcularMaxScoresHabilidades();renderizarPreguntasAleatorias();if(submitButton)submitButton.addEventListener('click',calcularResultado);else console.error("Submit missing.");if(form)form.addEventListener('input',updateProgressBar);else console.error("Form missing.");if(contactForm)contactForm.addEventListener('submit',handleContactFormSubmit);else console.error("Contact form missing.");}catch(error){console.error("Init Error:",error);if(preguntasContainer)displayError(preguntasContainer,`Error Crítico: ${error.message}. Recarga.`);if(submitButton)submitButton.style.display='none';if(progressContainer)progressContainer.style.display='none';}}
    // --- Initialization ---
    initializeTest();
}); // Fin DOMContentLoaded