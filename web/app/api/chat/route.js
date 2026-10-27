/* ============================================================
   /api/chat —— 替代 llm_server.py 的 LLM 代理。
   POST 接收 {messages, model?, temperature?, max_tokens?}，
   从环境变量读取 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL，
   以 stream:true 转发到 {base}/chat/completions：
     - 上游正常返回 SSE：原样透传
     - 上游忽略 stream 返回整段 JSON：转成 SSE
   API Key 只存在服务端环境变量，不进入浏览器，代码中不硬编码。
   ============================================================ */

export const runtime = 'nodejs';

const DEFAULT_BASE = 'https://apihub.agnes-ai.com/v1';
const DEFAULT_MODEL = 'agnes-2.5-flash';

function sseHeaders(){
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no'
  };
}

export async function POST(req){
  const apiKey = (process.env.LLM_API_KEY || '').trim();
  if(!apiKey){
    return Response.json(
      {error: '服务端未配置 API Key。请设置环境变量 LLM_API_KEY。'},
      {status: 400}
    );
  }

  const base = (process.env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  let payload;
  try{
    payload = await req.json();
  }catch(e){
    return Response.json({error: `请求体解析失败：${e.message || e}`}, {status: 400});
  }

  const upstream = {
    model: payload.model || model,
    messages: payload.messages || [],
    temperature: payload.temperature ?? 0.85,
    max_tokens: payload.max_tokens ?? 560,
    stream: true
  };

  let resp;
  try{
    resp = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(upstream)
    });
  }catch(e){
    return Response.json({error: `连接上游失败：${e.message || e}`}, {status: 502});
  }

  if(!resp.ok){
    let msg = '上游返回 HTTP ' + resp.status;
    try{
      const j = await resp.json();
      const e = j.error;
      if(typeof e === 'string') msg = e;
      else if(e && e.message) msg = e.message;
      else if(j.message) msg = j.message;
    }catch(e){}
    return Response.json({error: msg}, {status: resp.status});
  }

  const ctype = (resp.headers.get('content-type') || '').toLowerCase();

  // 上游正常流式返回：原样透传
  if(ctype.includes('text/event-stream') && resp.body){
    return new Response(resp.body, {status: 200, headers: sseHeaders()});
  }

  // 上游忽略 stream 返回整段 JSON：转成 SSE
  let text;
  try{
    const data = await resp.json();
    text = data?.choices?.[0]?.message?.content ?? '';
  }catch(e){
    return Response.json({error: '上游返回了无法解析的内容'}, {status: 502});
  }
  const chunk = 'data: ' + JSON.stringify({choices:[{delta:{content: text}}]}) + '\n\n' + 'data: [DONE]\n\n';
  return new Response(chunk, {status: 200, headers: sseHeaders()});
}
