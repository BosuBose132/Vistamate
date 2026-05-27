FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001
ENV MODEL_PATH=models/best.onnx
ENV IMAGE_SIZE=640
ENV CONFIDENCE_MIN=0.45
ENV IOU_THRESHOLD=0.45
ENV CLASS_NAMES=id_card
ENV CARD_CLASS_NAMES=id_card,card,business_card,id,identity_card

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src
RUN mkdir -p models

EXPOSE 8001

USER node

CMD ["npm", "start"]