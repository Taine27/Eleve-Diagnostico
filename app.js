/**
 * Eleve Soluções em Saúde - Quiz "Momentos de Negócio da Clínica"
 * 
 * Este arquivo controla toda a interface, transições de tela,
 * captura de leads e geração de links para o WhatsApp.
 */

import { calcularResultado, ORDEM_DESEMPATE } from './calcularResultado.js';

/* ==========================================================================
   CONFIGURAÇÕES GERAIS
   Altere aqui as variáveis principais sem precisar mexer na lógica interna.
   ========================================================================== */

/**
 * Ativa ou desativa a tela de captura de lead antes de exibir o resultado final.
 * true  = Exibe o formulário de captura (Nome, Clínica/Especialidade, Celular).
 * false = Vai direto para o resultado após a última pergunta.
 */
export const LEAD_CAPTURE = true;

/**
 * Número oficial de WhatsApp da Eleve Soluções em Saúde para atendimento.
 * Formato internacional sem espaços ou pontuação: DDI (55) + DDD (84) + Número.
 * Informado pelo cliente: +55 84 9406-6029 -> '558494066029'
 */
export const WHATSAPP_ELEVE = '558494066029';

/**
 * URL do Webhook do Google Apps Script conectado ao Google Planilhas da Eleve
 */
export const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzNVJF8F092ssuvuXp5mlZNARj9dmR2SvslWKTm5FxgP6gVhNnViCdV152Dun5vtirgYw/exec';

/**
 * Função responsável pelo envio dos dados de lead e respostas do quiz para o Google Sheets.
 */
export async function enviarLead(dados) {
  console.log('[Eleve Lead Capture] Enviando lead para o Google Sheets:', dados);
  
  // Salva localmente para segurança de dados durante a sessão
  try {
    sessionStorage.setItem('eleve_ultimo_lead', JSON.stringify(dados));
  } catch (e) {
    console.warn('Não foi possível salvar no sessionStorage', e);
  }

  // Envio direto para o Google Apps Script (modo no-cors para evitar bloqueios de redirecionamento)
  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    try {
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(dados)
      });
      console.log('[Eleve Lead Capture] Lead enviado com sucesso para a planilha!');
    } catch (erro) {
      console.error('[Eleve Lead Capture] Falha ao enviar para a planilha:', erro);
    }
  }
}

/* ==========================================================================
   ESTADO DA APLICAÇÃO
   ========================================================================== */
const state = {
  quizData: null,
  etapaAtual: 'inicio', // 'inicio' | 'pergunta' | 'lead' | 'resultado'
  indicePergunta: 0,
  respostas: [], // Array de 'Sim' ou 'Não'
  lead: {
    nome: '',
    clinicaEspecialidade: '',
    celular: ''
  },
  resultado: null
};

// Elemento container principal
const appContainer = document.getElementById('app');

/* ==========================================================================
   CARREGAMENTO DE DADOS
   ========================================================================== */
async function carregarDados() {
  try {
    const response = await fetch('./quiz_momentos_de_negocio.json');
    if (!response.ok) {
      throw new Error(`Erro HTTP ao carregar o arquivo JSON: ${response.status}`);
    }
    state.quizData = await response.json();
    renderizar();
  } catch (erro) {
    console.error('Falha ao carregar quiz_momentos_de_negocio.json:', erro);
    appContainer.innerHTML = `
      <div class="card card-alerta">
        <h2>Não foi possível carregar o quiz</h2>
        <p>Verifique se o arquivo <strong>quiz_momentos_de_negocio.json</strong> está na raiz do projeto.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Tentar novamente</button>
      </div>
    `;
  }
}

/* ==========================================================================
   FORMATAÇÃO E MÁSCARAS
   ========================================================================== */
function formatarCelular(valor) {
  // Remove tudo que não for dígito
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  
  if (apenasNumeros.length <= 2) {
    return apenasNumeros ? `(${apenasNumeros}` : '';
  }
  if (apenasNumeros.length <= 7) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
}

/* ==========================================================================
   CONTROLE DE NAVEGAÇÃO E RESPOSTAS
   ========================================================================== */
function iniciarQuiz() {
  state.etapaAtual = 'pergunta';
  state.indicePergunta = 0;
  state.respostas = [];
  renderizar();
}

function responder(respostaTexto) {
  state.respostas[state.indicePergunta] = respostaTexto;

  const totalPerguntas = state.quizData.perguntas.length;
  
  // Pequeno delay visual para feedback do clique antes da transição
  setTimeout(() => {
    if (state.indicePergunta < totalPerguntas - 1) {
      state.indicePergunta++;
      renderizar();
    } else {
      // Concluiu todas as perguntas
      finalizarPerguntas();
    }
  }, 180);
}

function voltarPergunta() {
  if (state.indicePergunta > 0) {
    state.indicePergunta--;
    renderizar();
  } else {
    state.etapaAtual = 'inicio';
    renderizar();
  }
}

function finalizarPerguntas() {
  state.resultado = calcularResultado(state.respostas, state.quizData);

  if (LEAD_CAPTURE) {
    state.etapaAtual = 'lead';
  } else {
    state.etapaAtual = 'resultado';
  }
  renderizar();
}

function submeterLead(event) {
  event.preventDefault();
  const form = event.target;
  const nome = form.nome.value.trim();
  const clinica = form.clinica.value.trim();
  const celular = form.celular.value.trim();

  if (!nome || !clinica || celular.replace(/\D/g, '').length < 10) {
    mostrarToast('Por favor, preencha todos os campos corretamente para continuar.');
    return;
  }

  state.lead = {
    nome,
    clinicaEspecialidade: clinica,
    celular,
    dataEnvio: new Date().toISOString(),
    momento: state.resultado ? state.resultado.perfil.nome : '',
    pontuacoes: state.resultado ? state.resultado.pontuacoes : null,
    respostas: [...state.respostas]
  };

  enviarLead(state.lead);

  state.etapaAtual = 'resultado';
  renderizar();
}

function refazerQuiz() {
  state.etapaAtual = 'inicio';
  state.indicePergunta = 0;
  state.respostas = [];
  state.resultado = null;
  renderizar();
}

/* ==========================================================================
   COMPARTILHAMENTO E WHATSAPP
   ========================================================================== */
function gerarLinkWhatsApp() {
  const perfilNome = state.resultado?.perfil?.nome || 'Diagnóstico';
  const nomeGestor = state.lead?.nome ? `Meu nome é ${state.lead.nome}` : 'Olá';
  const nomeClinica = state.lead?.clinicaEspecialidade ? ` da ${state.lead.clinicaEspecialidade}` : '';
  
  const mensagem = encodeURIComponent(
    `${nomeGestor}${nomeClinica}. Acabei de responder ao Quiz da Eleve e o diagnóstico apontou que nossa clínica está no momento: *${perfilNome}*.\n\nGostaria de conversar com um especialista da Eleve para entender as ações prioritárias para avançarmos para o próximo nível.`
  );

  return `https://wa.me/${WHATSAPP_ELEVE}?text=${mensagem}`;
}

async function compartilharResultado() {
  const perfilNome = state.resultado?.perfil?.nome || 'Diagnóstico da Clínica';
  const urlAtual = window.location.href;
  const shareData = {
    title: `Quiz Eleve: Minha clínica está no momento "${perfilNome}"`,
    text: `Descobri em qual momento de negócio minha clínica está através do Quiz da Eleve Soluções em Saúde. Faça você também!`,
    url: urlAtual
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // Usuário cancelou ou navegador falhou, segue para o fallback de cópia
    }
  }

  // Fallback: copiar para a área de transferência
  try {
    await navigator.clipboard.writeText(`${shareData.text}\n${urlAtual}`);
    mostrarToast('Link copiado para a área de transferência!');
  } catch (err) {
    mostrarToast('Copie o link no seu navegador para compartilhar.');
  }
}

function mostrarToast(mensagem) {
  let toast = document.getElementById('toast-feedback');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-feedback';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.classList.add('toast-visivel');
  setTimeout(() => {
    toast.classList.remove('toast-visivel');
  }, 3200);
}

/* ==========================================================================
   RENDERIZAÇÃO DAS TELAS
   ========================================================================== */
function renderizar() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  switch (state.etapaAtual) {
    case 'inicio':
      renderizarInicio();
      break;
    case 'pergunta':
      renderizarPergunta();
      break;
    case 'lead':
      renderizarLead();
      break;
    case 'resultado':
      renderizarResultado();
      break;
    default:
      renderizarInicio();
  }
}

// 1. TELA INICIAL
function renderizarInicio() {
  appContainer.innerHTML = `
    <div class="screen screen-inicio fade-in">
      <div class="header-badge">Diagnóstico Estratégico</div>
      <h1 class="main-title">Em qual momento de negócio está a sua clínica?</h1>
      <p class="subtitle">
        Descubra onde estão os maiores gargalos e as melhores oportunidades de crescimento da sua clínica em apenas <strong>11 perguntas rápidas</strong> de Sim ou Não (≈ 2 minutos).
      </p>

      <div class="jornada-preview">
        <div class="jornada-preview-title">Os 4 momentos da jornada:</div>
        <div class="jornada-chips">
          <span class="chip">1. Básico bem feito</span>
          <span class="chip-sep">→</span>
          <span class="chip">2. Bora Vender</span>
          <span class="chip-sep">→</span>
          <span class="chip">3. Hora de Encantar</span>
          <span class="chip-sep">→</span>
          <span class="chip">4. Bora Escalar</span>
        </div>
      </div>

      <div class="card-beneficios">
        <div class="beneficio-item">
          <span class="beneficio-icon">⚡</span>
          <span>100% gratuito e confidencial</span>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icon">🎯</span>
          <span>Direcionamento claro para sua equipe</span>
        </div>
        <div class="beneficio-item">
          <span class="beneficio-icon">📈</span>
          <span>Metodologia validada da Eleve Soluções em Saúde</span>
        </div>
      </div>

      <button id="btn-iniciar" class="btn btn-primary btn-large btn-block pulse">
        Começar diagnóstico gratuito
      </button>
    </div>
  `;

  document.getElementById('btn-iniciar').addEventListener('click', iniciarQuiz);
}

// 2. TELA DE PERGUNTA
function renderizarPergunta() {
  const pergunta = state.quizData.perguntas[state.indicePergunta];
  const totalPerguntas = state.quizData.perguntas.length;
  const numeroAtual = state.indicePergunta + 1;
  const porcentagem = Math.round((numeroAtual / totalPerguntas) * 100);
  const respostaAnterior = state.respostas[state.indicePergunta];

  appContainer.innerHTML = `
    <div class="screen screen-pergunta fade-in">
      <div class="top-nav">
        <button id="btn-voltar" class="btn-link" aria-label="Voltar para a pergunta anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Voltar
        </button>
        <span class="progresso-texto" aria-live="polite">Pergunta ${numeroAtual} de ${totalPerguntas}</span>
      </div>

      <div class="progress-bar-container" role="progressbar" aria-valuenow="${porcentagem}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar-fill" style="width: ${porcentagem}%;"></div>
      </div>

      <div class="pergunta-card">
        <div class="pergunta-numero-badge">Questão ${numeroAtual}</div>
        <h2 class="pergunta-texto">${pergunta.texto}</h2>
      </div>

      <div class="opcoes-respostas">
        <button id="btn-sim" class="btn btn-opcao ${respostaAnterior === 'Sim' ? 'selecionado' : ''}" data-resposta="Sim">
          <span class="opcao-check">✓</span>
          <span class="opcao-rotulo">Sim</span>
          <span class="opcao-atalho" title="Atalho de teclado">[1]</span>
        </button>
        <button id="btn-nao" class="btn btn-opcao ${respostaAnterior === 'Não' ? 'selecionado' : ''}" data-resposta="Não">
          <span class="opcao-check">✕</span>
          <span class="opcao-rotulo">Não</span>
          <span class="opcao-atalho" title="Atalho de teclado">[2]</span>
        </button>
      </div>

      <p class="dica-navegacao">Você também pode responder usando o teclado (<strong>1</strong> para Sim, <strong>2</strong> para Não).</p>
    </div>
  `;

  document.getElementById('btn-voltar').addEventListener('click', voltarPergunta);

  const btnSim = document.getElementById('btn-sim');
  const btnNao = document.getElementById('btn-nao');

  btnSim.addEventListener('click', () => {
    btnSim.classList.add('clicado');
    responder('Sim');
  });

  btnNao.addEventListener('click', () => {
    btnNao.classList.add('clicado');
    responder('Não');
  });
}

// 3. TELA DE CAPTURA DE LEAD
function renderizarLead() {
  appContainer.innerHTML = `
    <div class="screen screen-lead fade-in">
      <div class="header-badge">Diagnóstico Concluído!</div>
      <h1 class="main-title">Seu resultado está pronto</h1>
      <p class="subtitle">
        Informe os dados da sua clínica para liberar o seu diagnóstico exclusivo e recomendações personalizadas.
      </p>

      <form id="form-lead" class="card form-card" novalidate>
        <div class="input-group">
          <label for="nome">Seu nome completo *</label>
          <input 
            type="text" 
            id="nome" 
            name="nome" 
            placeholder="Ex.: Dra. Camila Vasconcelos" 
            required 
            autocomplete="name"
            value="${state.lead.nome || ''}"
          />
        </div>

        <div class="input-group">
          <label for="clinica">Nome da clínica / Especialidade *</label>
          <input 
            type="text" 
            id="clinica" 
            name="clinica" 
            placeholder="Ex.: Clínica OdontoVitta / Dermatologia" 
            required 
            value="${state.lead.clinicaEspecialidade || ''}"
          />
        </div>

        <div class="input-group">
          <label for="celular">WhatsApp com DDD *</label>
          <input 
            type="tel" 
            id="celular" 
            name="celular" 
            placeholder="(84) 99999-9999" 
            maxlength="15"
            required 
            autocomplete="tel"
            value="${state.lead.celular || ''}"
          />
          <span class="input-ajuda">Usaremos apenas para enviar materiais úteis para a sua gestão.</span>
        </div>

        <button type="submit" class="btn btn-primary btn-large btn-block">
          Visualizar diagnóstico da clínica →
        </button>
      </form>
    </div>
  `;

  const form = document.getElementById('form-lead');
  const inputCelular = document.getElementById('celular');

  inputCelular.addEventListener('input', (e) => {
    e.target.value = formatarCelular(e.target.value);
  });

  form.addEventListener('submit', submeterLead);
}

// 4. TELA DE RESULTADO
function renderizarResultado() {
  const { perfil, pontuacoes, perfilId } = state.resultado;

  // Monta a jornada visual dos 4 momentos
  const momentosLista = [
    { id: 'basico', numero: 1, nome: 'Básico bem feito', subtitulo: 'Estruturação & Processos' },
    { id: 'vender', numero: 2, nome: 'Bora Vender', subtitulo: 'Comercial & Faturamento' },
    { id: 'encantar', numero: 3, nome: 'Hora de Encantar', subtitulo: 'Experiência & Fidelização' },
    { id: 'escalar', numero: 4, nome: 'Bora Escalar', subtitulo: 'Expansão & Novos Mercados' }
  ];

  const linkWhatsapp = gerarLinkWhatsApp();

  appContainer.innerHTML = `
    <div class="screen screen-resultado fade-in">
      <div class="resultado-topo">
        <div class="header-badge badge-destaque">Diagnóstico da sua Clínica</div>
        <p class="resultado-pre">O momento atual identificado é:</p>
        <h1 class="resultado-nome">${perfil.nome}</h1>
      </div>

      <div class="card resultado-descricao-card">
        <div class="card-destaque-borda"></div>
        <p class="resultado-descricao-texto">${perfil.descricao}</p>
      </div>

      <!-- Visualização da Jornada dos 4 Momentos -->
      <div class="card jornada-card">
        <h3 class="jornada-titulo">Jornada de Maturidade da Clínica</h3>
        <p class="jornada-sub">Veja onde sua clínica está posicionada e os próximos passos para subir de nível:</p>

        <div class="timeline-jornada">
          ${momentosLista.map((momento, index) => {
            const isAtual = momento.id === perfilId;
            const indexAtual = momentosLista.findIndex(m => m.id === perfilId);
            const isPassado = index < indexAtual;
            
            let statusClasse = 'momento-futuro';
            let statusTag = 'Próximo passo';
            if (isAtual) {
              statusClasse = 'momento-atual';
              statusTag = 'Momento atual da sua clínica';
            } else if (isPassado) {
              statusClasse = 'momento-concluido';
              statusTag = 'Base inicial';
            }

            return `
              <div class="jornada-item ${statusClasse}">
                <div class="jornada-indicador">
                  <span class="jornada-circulo">${isPassado ? '✓' : momento.numero}</span>
                  ${index < momentosLista.length - 1 ? '<span class="jornada-linha"></span>' : ''}
                </div>
                <div class="jornada-conteudo">
                  <div class="jornada-header-item">
                    <span class="jornada-nome-momento">${momento.nome}</span>
                    <span class="tag-status">${statusTag}</span>
                  </div>
                  <span class="jornada-subtitulo-momento">${momento.subtitulo}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Resumo de Pontuação por Fase -->
      <details class="card pontuacao-detalhes">
        <summary class="pontuacao-resumo-toggle">
          <span>Ver pontuação detalhada por momento</span>
          <span class="seta-toggle">▾</span>
        </summary>
        <div class="pontuacao-barras">
          ${momentosLista.map(m => {
            const pts = pontuacoes[m.id] ?? 0;
            return `
              <div class="barra-item">
                <div class="barra-info">
                  <span class="barra-label">${m.nome}</span>
                  <span class="barra-valor"><strong>${pts}</strong> pts</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </details>

      <!-- Ações e CTAs -->
      <div class="acoes-resultado">
        <a 
          href="${linkWhatsapp}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn btn-whatsapp btn-large btn-block pulse"
        >
          <svg class="whatsapp-icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 2C6.511 2 2.016 6.496 2.016 12.016c0 1.93.55 3.738 1.504 5.277L2 22l4.87-1.477c1.473.844 3.18 1.328 4.992 1.328 5.52 0 10.016-4.496 10.016-10.016C21.878 6.496 17.55 2 12.031 2zm5.72 14.18c-.24.672-1.391 1.297-1.922 1.344-.508.047-1.148.078-3.719-.984-2.844-1.172-4.664-4.078-4.805-4.266-.14-.188-1.148-1.531-1.148-2.922 0-1.39.727-2.078.984-2.359.258-.281.563-.352.75-.352.188 0 .375.008.539.016.172.008.406-.063.633.484.242.578.82 2.016.89 2.164.07.148.117.328.024.516-.094.187-.14.305-.281.469-.14.164-.297.367-.422.492-.14.14-.289.297-.125.578.164.281.727 1.203 1.563 1.945 1.078.961 1.984 1.258 2.266 1.406.281.148.445.125.609-.063.164-.188.703-.82.89-1.102.188-.281.375-.234.633-.14.258.094 1.64.773 1.922.914.281.14.469.211.539.328.07.117.07.68-.172 1.352z"/>
          </svg>
          Falar com um especialista da Eleve
        </a>

        <button id="btn-compartilhar" class="btn btn-secondary btn-block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Compartilhar resultado
        </button>

        <button id="btn-refazer" class="btn btn-link btn-refazer">
          Refazer o quiz
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-compartilhar').addEventListener('click', compartilharResultado);
  document.getElementById('btn-refazer').addEventListener('click', refazerQuiz);
}

/* ==========================================================================
   ACESSIBILIDADE: NAVEGAÇÃO POR TECLADO
   ========================================================================== */
window.addEventListener('keydown', (event) => {
  if (state.etapaAtual !== 'pergunta') return;

  const tecla = event.key.toLowerCase();
  if (tecla === '1' || tecla === 's') {
    responder('Sim');
  } else if (tecla === '2' || tecla === 'n') {
    responder('Não');
  } else if (tecla === 'backspace' || tecla === 'arrowleft') {
    voltarPergunta();
  }
});

/* ==========================================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================================== */
carregarDados();
