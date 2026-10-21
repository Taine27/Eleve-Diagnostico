# Quiz "Momentos de Negócio da Clínica" — Eleve Soluções em Saúde

Aplicação web estática, responsiva e mobile-first para o diagnóstico de maturidade de clínicas de saúde. O quiz identifica em qual momento de negócio a clínica se encontra entre os 4 perfis: **Básico bem feito → Bora Vender → Hora de Encantar → Bora Escalar**.

---

## 🚀 Como Rodar Localmente

Por utilizar **JavaScript ES Modules** (`import` / `export`) e `fetch()` para carregar o arquivo `quiz_momentos_de_negocio.json`, a aplicação deve ser aberta através de um servidor HTTP local simples (não direto pelo `file://`).

### Opção 1: Usando Node / npx (Recomendado)
No terminal, dentro da pasta do projeto, execute:
```bash
npx serve .
```
E abra o endereço exibido no navegador (ex.: `http://localhost:3000`).

### Opção 2: Usando Python
Se tiver Python instalado:
```bash
python -m http.server 8000
```
E abra `http://localhost:8000`.

### Opção 3: Extensão "Live Server" no VS Code
Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.

---

## 🧪 Como Executar os Testes Automatizados

O cálculo de pontuação e as regras de desempate possuem testes unitários prontos em Node.js. Para executá-los:

```bash
node tests.js
```

Os testes cobrem:
- Resposta "Não" para todas as 11 perguntas (resultado: **Básico bem feito** com 33 pontos).
- Resposta "Sim" para todas as 11 perguntas (resultado: **Hora de Encantar** com 19 pontos).
- Regra de desempate prioritário (`basico > vender > encantar > escalar`).
- Cenários clínicos intermediários.

---

## ⚙️ Como Personalizar

### 1. Editar Perguntas, Respostas e Pesos
O arquivo `quiz_momentos_de_negocio.json` é a **fonte única da verdade**. Qualquer alteração feita nele reflete automaticamente na interface sem necessidade de alterar o código-fonte:
- Para mudar o texto de uma pergunta, altere o campo `"texto"`.
- Para ajustar o impacto no perfil, altere os valores numéricos em `"respostas"` (`"basico"`, `"vender"`, `"encantar"`, `"escalar"`).

> **Observação sobre a Pergunta 2:**  
> Conforme a regra original da pergunta 2 (*"Sua clínica possui processos e rotinas definidos?"*), responder "Sim" subtrai 1 ponto de "Bora Vender" (`"vender": -1`). Mantivemos o peso fiel ao JSON fornecido.

### 2. Ativar / Desativar a Captura de Leads
No arquivo `app.js`:
```javascript
// true = Exibe o formulário de nome, clínica/especialidade e celular antes do resultado
// false = Direciona imediatamente para o resultado ao responder a última pergunta
export const LEAD_CAPTURE = true;
```

### 3. Alterar o Número de WhatsApp da Eleve
No arquivo `app.js`:
```javascript
// Formato internacional sem caracteres especiais: DDI (55) + DDD + Número
export const WHATSAPP_ELEVE = '558494066029'; // +55 84 9406-6029
```

### 3. Integração com o Google Planilhas
O quiz já está conectado com o Google Sheets via Google Apps Script na constante:
```javascript
export const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/.../exec';
```
Cada lead preenchido e suas respostas individuais (P1 a P11) são gravados automaticamente em uma nova linha da planilha.

### 4. Alterar o Número de WhatsApp da Eleve
No arquivo `app.js`:
```javascript
// Formato internacional sem caracteres especiais: DDI (55) + DDD + Número
export const WHATSAPP_ELEVE = '558494066029'; // +55 84 9406-6029
```

---

## 🤖 Deploy Contínuo Automático (CI/CD)

O projeto possui um workflow configurado no GitHub Actions (`.github/workflows/deploy.yml`). 
Sempre que um novo commit é enviado para a branch `main`:
1. O GitHub conecta-se ao servidor VPS via SSH pela porta `22022`.
2. Executa `git pull origin main` no diretório de produção (`/var/www/eleve-diagnostico`).
3. As alterações entram no ar imediatamente em **https://quiz.elevesolucoes.com.br** sem necessidade de comandos manuais no terminal.

---

## 🌐 Como Publicar (Deploy)

A aplicação é **100% estática** (apenas HTML, CSS, JS e JSON), sem necessidade de build ou backend.

### No Vercel
1. Instale o CLI da Vercel (`npm i -g vercel`) e execute `vercel`, ou
2. Conecte o repositório no dashboard da [Vercel](https://vercel.com) e clique em **Deploy**.

### No Netlify
1. Arraste a pasta do projeto diretamente na aba "Sites" do [Netlify Drop](https://app.netlify.com/drop), ou
2. Conecte o repositório Git no Netlify com as configurações padrão (Publish directory: `.`).

### No GitHub Pages
1. Acesse o repositório no GitHub > **Settings** > **Pages**.
2. Em **Source**, selecione a branch `main` (ou `master`) e a pasta raiz (`/root`).
3. Clique em **Save**. O site estará disponível em poucos minutos.

---

## 🎨 Identidade Visual Utilizada

| Token CSS | Hexadecimal | Aplicação |
|---|---|---|
| `--verde-agua` | `#5BB8AB` | Botões principais, status de momento atual, destaques |
| `--azul-petroleo` | `#4A8597` | Barra de progresso, links, subtítulos |
| `--roxo-escuro` | `#3A0952` | Títulos principais, logo, tipografia de impacto |
| `--cinza-escuro` | `#3A3A3A` | Texto padrão |
| `--cinza-azulado` | `#D0D9DC` | Bordas e botões neutros |
| `--cinza-claro` | `#F8F9FA` | Fundo principal suave |
| `--branco` | `#FFFFFF` | Fundo dos cards e botões |
