/* /api/health —— 供前端检测服务端 LLM 代理是否可用（对应原 llm_server.py 的同名接口） */

export const runtime = 'nodejs';

export async function GET(){
  return Response.json({
    configured: !!(process.env.LLM_API_KEY || '').trim(),
    model: process.env.LLM_MODEL || 'agnes-2.5-flash',
    base: (process.env.LLM_BASE_URL || 'https://apihub.agnes-ai.com/v1').replace(/\/+$/, '')
  });
}
