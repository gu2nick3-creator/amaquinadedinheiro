import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `Você é a IA Vendedora, especialista em vendas pelo WhatsApp para pequenos negócios. Gere respostas curtas, naturais, persuasivas e prontas para copiar e colar. Foque em fechamento, quebra de objeções, follow-up e recuperação de clientes. Nunca use linguagem robótica. Responda em português do Brasil.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    const model = Deno.env.get('OPENROUTER_MODEL') || 'deepseek/deepseek-chat'

    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY não configurada nos secrets da Supabase.')
    }

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceRole)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const inputText = String(body.input_text || '').trim()
    const tone = String(body.tone || 'Profissional')
    const category = String(body.category || 'Vendas')

    if (!inputText) {
      return new Response(JSON.stringify({ error: 'Mensagem vazia.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userPrompt = `Categoria: ${category}\nTom: ${tone}\nMensagem do cliente: ${inputText}\n\nCrie uma resposta de WhatsApp pronta para enviar.`

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://iavendedora.com',
        'X-Title': 'IA Vendedora',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 450,
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      throw new Error(`OpenRouter ${aiRes.status}: ${errText.slice(0, 300)}`)
    }

    const aiJson = await aiRes.json()
    const outputText = aiJson?.choices?.[0]?.message?.content?.trim()
    if (!outputText) throw new Error('A IA não retornou texto.')

    const { data: generation, error: insertError } = await admin
      .from('ai_generations')
      .insert({
        user_id: user.id,
        input_text: inputText,
        output_text: outputText,
        category,
        tone,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Erro ao salvar geração:', insertError)
    }

    await admin.rpc('increment_usage', { user_id_param: user.id }).catch(() => null)

    return new Response(JSON.stringify({ output_text: outputText, generation_id: generation?.id || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
