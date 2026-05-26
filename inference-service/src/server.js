import express from 'express';
import cors from 'cors';

const app = express();

const PORT = process.env.PORT || 8001;
const MODEL_PATH = process.env.MODEL_PATH || 'models/best.onnx';
const CONFIDENCE_MIN = Number(process.env.CONFIDENCE_MIN || 0.45);

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'vistamate-local-inference-service',
    runtime: 'node',
    modelPath: MODEL_PATH,
    confidenceMin: CONFIDENCE_MIN,
  });
});

app.post('/detect', async (req, res) => {
  const { image } = req.body || {};

  if (!image || typeof image !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'Image base64 string is required.',
    });
  }

  // Temporary response.
  // Later this is where ONNX model inference will run.
  return res.json({
    ok: false,
    prediction: null,
    predictions: [],
    provider: 'local-container-placeholder',
    message: 'Container is running. Model inference is not connected yet.',
  });
});

app.listen(PORT, () => {
  console.log(`Vistamate local inference service running on port ${PORT}`);
});
