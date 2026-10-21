import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calcularResultado } from './calcularResultado.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'quiz_momentos_de_negocio.json');
const quizData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('--- Iniciando Testes de Cálculo do Quiz Eleve ---');

// Teste 1: Todas "Não"
const todasNao = Array(11).fill('Não');
const resTodasNao = calcularResultado(todasNao, quizData);
console.log('\n[Teste 1] Todas respostas "Não":');
console.log('Pontuações:', resTodasNao.pontuacoes);
console.log('Resultado obtido:', resTodasNao.perfilId, '-', resTodasNao.perfil.nome);
if (resTodasNao.perfilId === 'basico' && resTodasNao.pontuacoes.basico === 33) {
  console.log('  -> PASSOU: Básico bem feito venceu com 33 pontos.');
} else {
  console.error('  -> FALHOU!', resTodasNao);
}

// Teste 2: Todas "Sim"
const todasSim = Array(11).fill('Sim');
const resTodasSim = calcularResultado(todasSim, quizData);
console.log('\n[Teste 2] Todas respostas "Sim":');
console.log('Pontuações:', resTodasSim.pontuacoes);
console.log('Resultado obtido:', resTodasSim.perfilId, '-', resTodasSim.perfil.nome);
if (resTodasSim.perfilId === 'encantar') {
  console.log('  -> PASSOU: Hora de Encantar venceu com 19 pontos.');
} else {
  console.error('  -> FALHOU!', resTodasSim);
}

// Teste 3: Teste de Desempate (Forçando empate artificial)
console.log('\n[Teste 3] Regra de Desempate:');
const dadosMockEmpate = {
  perfis: [
    { id: 'basico', nome: 'Básico bem feito', descricao: '...' },
    { id: 'vender', nome: 'Bora Vender', descricao: '...' },
    { id: 'encantar', nome: 'Hora de Encantar', descricao: '...' },
    { id: 'escalar', nome: 'Bora Escalar', descricao: '...' }
  ],
  perguntas: [
    {
      n: 1,
      texto: 'Pergunta Teste',
      respostas: {
        'Sim': { basico: 5, vender: 5, encantar: 5, escalar: 5 },
        'Não': { basico: 0, vender: 0, encantar: 0, escalar: 0 }
      }
    }
  ]
};
const resEmpate = calcularResultado(['Sim'], dadosMockEmpate);
console.log('Pontuações iguais (5, 5, 5, 5): Vencedor desempate =', resEmpate.perfilId);
if (resEmpate.perfilId === 'basico') {
  console.log('  -> PASSOU: Desempate priorizou basico com sucesso.');
} else {
  console.error('  -> FALHOU no desempate!', resEmpate);
}

// Teste 4: Cenário com foco em Vender
// Pergunta 1: Sim (vender +2), Pergunta 5: Sim (vender +3), Pergunta 7: Sim (vender +3), Pergunta 9: Não (vender +3)
// e outras Não para não pontuar muito encantar/escalar
const respostasVender = ['Sim', 'Não', 'Não', 'Não', 'Sim', 'Não', 'Sim', 'Não', 'Não', 'Sim', 'Não'];
const resVender = calcularResultado(respostasVender, quizData);
console.log('\n[Teste 4] Cenário clínico personalizado:');
console.log('Pontuações:', resVender.pontuacoes);
console.log('Resultado:', resVender.perfilId, '-', resVender.perfil.nome);

console.log('\n--- Testes Concluídos ---');
