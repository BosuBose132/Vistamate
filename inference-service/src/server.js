import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';

const app = express();

const PORT = Number(process.env.PORT || 8001);
const MODEL_PATH = process.env.MODEL_PATH || 'models/best.onnx';
const IMAGE_SIZE = Number(process.env.IMAGE_SIZE || 640);
const CONFIDENCE_MIN = Number(process.env.CONFIDENCE_MIN || 0.45);
const IOU_THRESHOLD = Number(process.env.IOU_THRESHOLD || 0.45);

const CLASS_NAMES = (process.env.CLASS_NAMES || 'id_card')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const CARD_CLASS_NAMES = new Set(
  (
    process.env.CARD_CLASS_NAMES ||
    'id_card,card,business_card,id,identity_card'
  )
    .split(',')
    .map((name) => normalizeClassName(name)),
);

let sessionPromise = null;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

function normalizeClassName(value = '') {
  return String(value).toLowerCase().replace(/[-\s]/g, '_');
}

function stripDataUrl(imageData) {
  if (imageData.startsWith('data:image') && imageData.includes(',')) {
    return imageData.split(',', 2)[1];
  }

  return imageData;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getClassName(classId) {
  return CLASS_NAMES[classId] || `class_${classId}`;
}

async function getSession() {
  if (!sessionPromise) {
    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error(
        `Model file not found at ${MODEL_PATH}. Add best.onnx or set MODEL_PATH.`,
      );
    }

    sessionPromise = ort.InferenceSession.create(MODEL_PATH);
  }

  return sessionPromise;
}

async function preprocessImage(base64Image) {
  const imageBuffer = Buffer.from(stripDataUrl(base64Image), 'base64');

  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  if (!originalWidth || !originalHeight) {
    throw new Error('Unable to read image width/height.');
  }

  const scale = Math.min(
    IMAGE_SIZE / originalWidth,
    IMAGE_SIZE / originalHeight,
  );
  const resizedWidth = Math.round(originalWidth * scale);
  const resizedHeight = Math.round(originalHeight * scale);

  const padX = Math.floor((IMAGE_SIZE - resizedWidth) / 2);
  const padY = Math.floor((IMAGE_SIZE - resizedHeight) / 2);

  const rightPad = IMAGE_SIZE - resizedWidth - padX;
  const bottomPad = IMAGE_SIZE - resizedHeight - padY;

  const rawRgb = await sharp(imageBuffer)
    .resize(resizedWidth, resizedHeight, { fit: 'fill' })
    .extend({
      top: padY,
      bottom: bottomPad,
      left: padX,
      right: rightPad,
      background: { r: 114, g: 114, b: 114 },
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  const pixels = IMAGE_SIZE * IMAGE_SIZE;
  const input = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i += 1) {
    const rgbIndex = i * 3;

    input[i] = rawRgb[rgbIndex] / 255;
    input[pixels + i] = rawRgb[rgbIndex + 1] / 255;
    input[pixels * 2 + i] = rawRgb[rgbIndex + 2] / 255;
  }

  return {
    tensor: new ort.Tensor('float32', input, [1, 3, IMAGE_SIZE, IMAGE_SIZE]),
    originalWidth,
    originalHeight,
    scale,
    padX,
    padY,
  };
}

function toOriginalBox(box, meta) {
  let { x1, y1, x2, y2 } = box;

  const maxValue = Math.max(x1, y1, x2, y2);
  if (maxValue <= 1.5) {
    x1 *= IMAGE_SIZE;
    y1 *= IMAGE_SIZE;
    x2 *= IMAGE_SIZE;
    y2 *= IMAGE_SIZE;
  }

  const originalX1 = clamp(
    (x1 - meta.padX) / meta.scale,
    0,
    meta.originalWidth,
  );
  const originalY1 = clamp(
    (y1 - meta.padY) / meta.scale,
    0,
    meta.originalHeight,
  );
  const originalX2 = clamp(
    (x2 - meta.padX) / meta.scale,
    0,
    meta.originalWidth,
  );
  const originalY2 = clamp(
    (y2 - meta.padY) / meta.scale,
    0,
    meta.originalHeight,
  );

  const width = Math.max(0, originalX2 - originalX1);
  const height = Math.max(0, originalY2 - originalY1);

  return {
    x1: originalX1,
    y1: originalY1,
    x2: originalX2,
    y2: originalY2,
    x: originalX1 + width / 2,
    y: originalY1 + height / 2,
    width,
    height,
  };
}

function parseYoloOutput(outputTensor, meta) {
  const { data, dims } = outputTensor;
  const predictions = [];

  if (!dims || dims.length < 2) {
    return predictions;
  }

  let boxes = [];
  let attrs = 0;
  let getValue;

  if (dims.length === 3) {
    const [, dim1, dim2] = dims;

    // Common YOLO format: [1, attributes, boxes]
    if (dim1 < dim2) {
      attrs = dim1;
      boxes = Array.from({ length: dim2 }, (_, index) => index);
      getValue = (boxIndex, attrIndex) => data[attrIndex * dim2 + boxIndex];
    } else {
      // Alternative format: [1, boxes, attributes]
      attrs = dim2;
      boxes = Array.from({ length: dim1 }, (_, index) => index);
      getValue = (boxIndex, attrIndex) => data[boxIndex * attrs + attrIndex];
    }
  } else if (dims.length === 2) {
    const [dim1, dim2] = dims;
    attrs = dim2;
    boxes = Array.from({ length: dim1 }, (_, index) => index);
    getValue = (boxIndex, attrIndex) => data[boxIndex * attrs + attrIndex];
  } else {
    return predictions;
  }

  for (const boxIndex of boxes) {
    // Some ONNX exports with NMS return [x1, y1, x2, y2, score, class]
    if (attrs === 6) {
      const score = Number(getValue(boxIndex, 4));
      if (score < CONFIDENCE_MIN) continue;

      const classId = Math.round(Number(getValue(boxIndex, 5)));
      const className = getClassName(classId);

      const mappedBox = toOriginalBox(
        {
          x1: Number(getValue(boxIndex, 0)),
          y1: Number(getValue(boxIndex, 1)),
          x2: Number(getValue(boxIndex, 2)),
          y2: Number(getValue(boxIndex, 3)),
        },
        meta,
      );

      predictions.push({
        class: className,
        classId,
        confidence: score,
        ...mappedBox,
      });

      continue;
    }

    // Raw YOLO output: [centerX, centerY, width, height, class scores...]
    if (attrs < 5) continue;

    const cx = Number(getValue(boxIndex, 0));
    const cy = Number(getValue(boxIndex, 1));
    const w = Number(getValue(boxIndex, 2));
    const h = Number(getValue(boxIndex, 3));

    let bestClassId = 0;
    let bestScore = 0;

    if (attrs === 5) {
      // One-class model: [cx, cy, w, h, score]
      bestScore = Number(getValue(boxIndex, 4));
    } else {
      for (let attrIndex = 4; attrIndex < attrs; attrIndex += 1) {
        const score = Number(getValue(boxIndex, attrIndex));
        if (score > bestScore) {
          bestScore = score;
          bestClassId = attrIndex - 4;
        }
      }
    }

    if (bestScore < CONFIDENCE_MIN) continue;

    const mappedBox = toOriginalBox(
      {
        x1: cx - w / 2,
        y1: cy - h / 2,
        x2: cx + w / 2,
        y2: cy + h / 2,
      },
      meta,
    );

    predictions.push({
      class: getClassName(bestClassId),
      classId: bestClassId,
      confidence: bestScore,
      ...mappedBox,
    });
  }

  return predictions;
}

function boxIou(a, b) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

function applyNms(predictions) {
  const sorted = [...predictions].sort(
    (a, b) => (b.confidence || 0) - (a.confidence || 0),
  );

  const selected = [];

  for (const prediction of sorted) {
    const overlapsExisting = selected.some(
      (item) =>
        item.classId === prediction.classId &&
        boxIou(item, prediction) > IOU_THRESHOLD,
    );

    if (!overlapsExisting) {
      selected.push(prediction);
    }
  }

  return selected;
}

function isCardPrediction(prediction) {
  return CARD_CLASS_NAMES.has(normalizeClassName(prediction.class));
}

app.get('/health', async (req, res) => {
  try {
    const session = await getSession();

    res.json({
      ok: true,
      service: 'vistamate-local-inference-service',
      runtime: 'node',
      modelPath: MODEL_PATH,
      imageSize: IMAGE_SIZE,
      confidenceMin: CONFIDENCE_MIN,
      inputNames: session.inputNames,
      outputNames: session.outputNames,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

app.post('/detect', async (req, res) => {
  try {
    const { image } = req.body || {};

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Image base64 string is required.',
      });
    }

    const session = await getSession();
    const meta = await preprocessImage(image);

    const inputName = session.inputNames[0];
    const feeds = {
      [inputName]: meta.tensor,
    };

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];
    const outputTensor = results[outputName];

    const rawPredictions = parseYoloOutput(outputTensor, meta);
    const predictions = applyNms(rawPredictions);

    const cardPredictions = predictions.filter(isCardPrediction);
    const bestCard =
      cardPredictions.sort(
        (a, b) => (b.confidence || 0) - (a.confidence || 0),
      )[0] || null;

    return res.json({
      ok: Boolean(bestCard),
      prediction: bestCard,
      predictions,
      provider: 'mie-container-onnx',
    });
  } catch (err) {
    console.error('Local ONNX detection failed:', err);

    return res.status(500).json({
      ok: false,
      error: err.message,
      prediction: null,
      predictions: [],
      provider: 'mie-container-onnx',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Vistamate local ONNX inference service running on port ${PORT}`);
});
