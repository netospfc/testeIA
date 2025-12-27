# Demo Spring Boot - Saudação por Horário

Uma aplicação Spring Boot simples que demonstra uma API REST para saudações baseadas no horário do dia.

## 🚀 Funcionalidades

- **API REST**: Endpoint `/saudacao` que retorna saudações dinâmicas
- **Saudação Inteligente**: Retorna "Bom dia!", "Boa tarde!" ou "Boa noite!" baseado na hora atual
- **Spring Boot**: Framework moderno para desenvolvimento Java
- **Java 21 LTS**: Utiliza a versão mais recente do Java com suporte de longo prazo

## 📋 Pré-requisitos

- **Java 21** ou superior
- **Maven 3.6+** ou qualquer build tool compatível

## 🛠️ Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd testeIA
```

### 2. Compile o projeto
```bash
mvn clean compile
```

### 3. Execute a aplicação
```bash
mvn spring-boot:run
# ou
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

A aplicação estará disponível em: `http://localhost:8080`

## 📖 Uso da API

### Endpoint de Saudação

**GET** `/saudacao`

Retorna uma saudação baseada no horário atual do servidor.

#### Exemplos de resposta:

- **Manhã (06:00 - 11:59)**: `"Bom dia!"`
- **Tarde (12:00 - 17:59)**: `"Boa tarde!"`
- **Noite (18:00 - 05:59)**: `"Boa noite!"`

#### Exemplo de uso com curl:
```bash
curl http://localhost:8080/saudacao
```

#### Exemplo de resposta:
```json
"Boa tarde!"
```

## 🏗️ Estrutura do Projeto

```
src/
├── main/
│   ├── java/
│   │   └── com/example/demo/
│   │       ├── DemoApplication.java      # Classe principal Spring Boot
│   │       └── SaudacaoController.java   # Controller REST da saudação
│   └── resources/
│       └── application.properties        # Configurações da aplicação
└── test/
    └── java/
        └── com/example/demo/
            └── DemoApplicationTests.java # Testes da aplicação
```

## 🧪 Testes

Execute os testes com:
```bash
mvn test
```

## 📦 Build e Empacotamento

Para criar um JAR executável:
```bash
mvn clean package
```

O arquivo `demo-0.0.1-SNAPSHOT.jar` será gerado na pasta `target/`.

## 🔧 Configuração

A aplicação utiliza as configurações padrão do Spring Boot. Você pode personalizar através do arquivo `application.properties`:

```properties
# Porta do servidor (padrão: 8080)
server.port=8080

# Outras configurações do Spring Boot
```

## 🐛 Logs

Ao iniciar, a aplicação imprime no console:
```
Estou funcionando
```

Este log confirma que a aplicação iniciou corretamente.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Seu Nome** - [Seu GitHub](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- [Spring Boot](https://spring.io/projects/spring-boot) - Framework utilizado
- [Maven](https://maven.apache.org/) - Gerenciador de dependências e build
- [Java 21](https://www.oracle.com/java/) - Plataforma de desenvolvimento

---

⭐ **Dê uma estrela se este projeto te ajudou!**
