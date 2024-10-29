# Imagem base
FROM node:20-alpine

# Definição de pasta
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Cópia da aplicação
COPY ../ .

RUN npx prisma generate
RUN npm i
RUN npm run build

# Definição de variáveis
ARG PORT=4000
ENV PORT=${SERVER_PORT}

# Exposição de portas
EXPOSE ${PORT}

# Inicialização
CMD ["npm", "run", "start:prod"]
