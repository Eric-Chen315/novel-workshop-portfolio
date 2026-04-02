export function getModelConfig(step: string): { model: string; apiKey: string; baseUrl: string } {
  const stepToModelType: Record<string, 'WRITER' | 'REVIEWER'> = {
    '初稿': 'WRITER',
    '读者反馈': 'REVIEWER',
    '二稿': 'WRITER',
    '审核报告': 'REVIEWER',
    '终稿': 'WRITER',
  };

  const modelType = stepToModelType[step] || 'DEFAULT';
  const modelKey = `${modelType}_MODEL`;
  const apiKeyKey = `${modelType}_API_KEY`;
  const baseUrlKey = `${modelType}_BASE_URL`;

  const model = process.env[modelKey] || process.env.DEFAULT_MODEL;
  const apiKey = process.env[apiKeyKey] || process.env.DEFAULT_API_KEY;
  const baseUrl = process.env[baseUrlKey] || process.env.DEFAULT_BASE_URL;

  if (!model || !apiKey || !baseUrl) {
    throw new Error(`Missing configuration for ${step}. Please check your .env.local file.`);
  }

  return { model, apiKey, baseUrl };
}