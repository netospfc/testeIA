# Custora — Gestão e Economia de Manufatura 3D

O **Custora** é uma plataforma full-stack completa para gerenciamento de estúdios de impressão 3D, focada em controle de custos, gestão de inventário, manutenção de hardware e fluxo de pedidos.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React** (Vite)
- **Design System:** CSS Vanilla (Baseado em tokens do Stitch)
- **Gráficos:** Recharts
- **i18n:** react-i18next (Português e Inglês)
- **Ícones:** Material Icons

### Backend
- **Node.js** com **Express**
- **Banco de Dados:** SQLite (Better-SQLite3)
- **Autenticação:** JWT (JSON Web Tokens)
- **Criptografia:** BCryptJS

## 🛠️ Funcionalidades Principais

O sistema conta com 8 telas fundamentais:

1.  **Login / Register:** Acesso seguro com persistência de sessão.
2.  **Dashboard (Kanban):** Gestão visual de pedidos em Fila, Impressão e Pós-processamento.
3.  **Calculadora de Custos:** Modelagem em tempo real considerando material, energia, depreciação e margem.
4.  **Inventário:** Controle de estoque de filamentos e status das impressoras.
5.  **Arquiteto de Produto:** Criação de blueprints (BOM) com múltiplos componentes e custos de mão de obra.
6.  **Manutenção:** Agenda completa com tema escuro, alertas de tarefas atrasadas e calendário de eventos.
7.  **Relatórios Financeiros:** KPIs de lucro, custo de energia e eficiência de hardware com gráficos.
8.  **Configurações:** Setup global de custos fixos (energia, falha, depreciação e embalagens).

## 🏁 Como Iniciar

Certifique-se de ter o **Node.js** instalado em sua máquina.

1.  Clone o repositório.
2.  Na raiz do projeto, execute:
    ```bash
    npm start
    ```
    *Este comando irá instalar as dependências do cliente, realizar o build do frontend e iniciar o servidor na porta 8080.*

3.  Acesse: **[http://localhost:8080](http://localhost:8080)**

### 🔑 Credenciais de Demonstração
- **Usuário:** `admin@custora.com`
- **Senha:** `admin123`

## 📁 Estrutura do Projeto

```text
/
├── client/               # Frontend React
│   ├── src/
│   │   ├── api/          # Cliente Axios e chamadas de API
│   │   ├── components/   # Sidebar, Navbar e UI Reusable
│   │   ├── contexts/     # Autenticação e Estados Globais
│   │   ├── i18n/         # Traduções (PT/EN)
│   │   └── pages/        # Telas da aplicação
│   └── vite.config.js    # Configurações do Vite e Proxy
├── server/               # Backend Node.js
│   ├── db/               # Esquema SQLite e Dados Iniciais
│   ├── handlers/         # Lógica dos Endpoints da API
│   ├── middleware/       # Autenticação e Segurança
│   └── index.js          # Ponto de entrada do servidor
└── package.json          # Scripts globais de execução
```

---
Desenvolvido para máxima precisão na manufatura digital.
