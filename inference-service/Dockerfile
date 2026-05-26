FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001
ENV MODEL_PATH=models/best.onnx
ENV CONFIDENCE_MIN=0.45

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

EXPOSE 8001

USER node

CMD ["npm", "start"]