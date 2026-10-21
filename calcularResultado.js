/**
 * Eleve Soluções em Saúde - Quiz "Momentos de Negócio da Clínica"
 * 
 * Função pura para cálculo do resultado do quiz.
 * 
 * Regra de desempate:
 * Em caso de empate entre duas ou mais pontuações máximas, vence o momento
 * mais inicial da jornada: 'basico' > 'vender' > 'encantar' > 'escalar'.
 */

export const ORDEM_DESEMPATE = ['basico', 'vender', 'encantar', 'escalar'];

/**
 * Calcula o resultado do quiz a partir das respostas do usuário e do JSON de dados.
 * 
 * @param {Array<string>} respostas - Array com as respostas em ordem ("Sim" ou "Não")
 * @param {Object} dados - Conteúdo completo do quiz_momentos_de_negocio.json
 * @returns {Object} { perfilId, perfil, pontuacoes, ordenadoPorPontos }
 */
export function calcularResultado(respostas, dados) {
  if (!dados || !Array.isArray(dados.perguntas) || !Array.isArray(dados.perfis)) {
    throw new Error('Dados do quiz inválidos ou incompletos.');
  }

  // Inicializa o placar com 0 para cada perfil
  const pontuacoes = {
    basico: 0,
    vender: 0,
    encantar: 0,
    escalar: 0
  };

  // Soma os pontos de cada resposta
  dados.perguntas.forEach((pergunta, index) => {
    const resposta = respostas[index];
    if (resposta && pergunta.respostas && pergunta.respostas[resposta]) {
      const pesos = pergunta.respostas[resposta];
      for (const [perfil, valor] of Object.entries(pesos)) {
        if (typeof pontuacoes[perfil] === 'number') {
          pontuacoes[perfil] += valor;
        }
      }
    }
  });

  // Determina o perfil com maior pontuação considerando a regra de desempate
  let vencedorId = ORDEM_DESEMPATE[0];
  let maiorPontuacao = -Infinity;

  for (const perfilId of ORDEM_DESEMPATE) {
    const pontos = pontuacoes[perfilId];
    if (pontos > maiorPontuacao) {
      maiorPontuacao = pontos;
      vencedorId = perfilId;
    }
    // Nota: Em caso de empate (pontos === maiorPontuacao), mantemos o primeiro encontrado
    // porque ORDEM_DESEMPATE já está na ordem de prioridade (basico > vender > encantar > escalar).
  }

  const perfil = dados.perfis.find(p => p.id === vencedorId) || null;

  return {
    perfilId: vencedorId,
    perfil,
    pontuacoes
  };
}
