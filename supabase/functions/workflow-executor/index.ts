// Edge Function para ejecutar workflows
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workflowId, inputData = {} } = await req.json()

    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'Workflow ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Obtener workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Crear registro de ejecución
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        input_data: inputData,
        output_data: {},
        logs: [],
        nodes_executed: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (execError || !execution) {
      return new Response(JSON.stringify({ error: 'Failed to create execution' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ejecutar workflow en segundo plano
    executeWorkflow(supabase, execution.id, workflow, inputData)

    return new Response(JSON.stringify({ 
      success: true, 
      executionId: execution.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function executeWorkflow(
  supabase: any,
  executionId: string,
  workflow: any,
  inputData: any
) {
  const startTime = Date.now()
  const logs: any[] = []
  let nodesExecuted = 0
  let outputData: any = {}

  try {
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Iniciando ejecución del workflow: ${workflow.name}`
    })

    // Encontrar nodo trigger
    const nodes = workflow.nodes || []
    const connections = workflow.connections || []
    const triggerNode = nodes.find((n: any) => n.type === 'trigger')

    if (!triggerNode) {
      throw new Error('No se encontró nodo trigger')
    }

    // Ejecutar nodos en secuencia
    let currentNodeId = triggerNode.id
    const executedNodes = new Set<string>()
    const nodeOutputs: Record<string, any> = { [triggerNode.id]: inputData }

    while (currentNodeId) {
      if (executedNodes.has(currentNodeId)) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'warning',
          message: `Ciclo detectado en nodo: ${currentNodeId}`,
          nodeId: currentNodeId
        })
        break
      }

      const node = nodes.find((n: any) => n.id === currentNodeId)

      if (!node) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Nodo no encontrado: ${currentNodeId}`,
          nodeId: currentNodeId
        })
        break
      }

      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Ejecutando nodo: ${node.name}`,
        nodeId: node.id
      })

      try {
        const nodeInput = nodeOutputs[currentNodeId] || {}
        const nodeOutput = await executeNode(supabase, node, nodeInput, workflow)

        nodeOutputs[node.id] = nodeOutput
        executedNodes.add(currentNodeId)
        nodesExecuted++

        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Nodo completado: ${node.name}`,
          nodeId: node.id
        })

        // Encontrar siguiente nodo
        const connection = connections.find((c: any) => c.source === currentNodeId)

        if (connection) {
          currentNodeId = connection.target
          nodeOutputs[currentNodeId] = nodeOutput
        } else {
          outputData = nodeOutput
          currentNodeId = ''
        }
      } catch (nodeError: any) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Error en nodo ${node.name}: ${nodeError.message}`,
          nodeId: node.id
        })
        throw nodeError
      }
    }

    // Ejecución exitosa
    const duration = Date.now() - startTime

    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        output_data: outputData,
        logs: logs,
        nodes_executed: nodesExecuted,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)

    // Actualizar estadísticas del workflow
    await supabase
      .from('workflows')
      .update({
        total_executions: workflow.total_executions + 1,
        successful_executions: workflow.successful_executions + 1,
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflow.id)

  } catch (error: any) {
    const duration = Date.now() - startTime

    logs.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Error en ejecución: ${error.message}`
    })

    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        logs: logs,
        nodes_executed: nodesExecuted,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId)

    await supabase
      .from('workflows')
      .update({
        total_executions: workflow.total_executions + 1,
        failed_executions: workflow.failed_executions + 1,
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflow.id)
  }
}

async function executeNode(
  supabase: any,
  node: any,
  input: any,
  workflow: any
): Promise<any> {
  switch (node.type) {
    case 'trigger':
      return input

    case 'action':
      return await executeAction(supabase, node, input)

    case 'condition':
      return await executeCondition(node, input)

    case 'ai':
      return await executeAI(node, input)

    case 'integration':
      return await executeIntegration(node, input)

    case 'output':
      return input

    default:
      return input
  }
}

async function executeAction(supabase: any, node: any, input: any): Promise<any> {
  const actionType = node.data?.actionType || node.name.toLowerCase()

  if (actionType.includes('email')) {
    // Enviar email (integración con servicio de email)
    console.log('Sending email:', node.data)
    return { ...input, emailSent: true }
  }

  if (actionType.includes('sms') || actionType.includes('whatsapp')) {
    // Enviar SMS/WhatsApp
    console.log('Sending message:', node.data)
    return { ...input, messageSent: true }
  }

  if (actionType.includes('database') || actionType.includes('update')) {
    // Actualizar base de datos
    console.log('Updating database:', node.data)
    return { ...input, databaseUpdated: true }
  }

  return { ...input, actionExecuted: true }
}

async function executeCondition(node: any, input: any): Promise<any> {
  // Evaluar condición simple
  const condition = node.data?.condition || {}
  const field = condition.field
  const operator = condition.operator
  const value = condition.value

  if (!field || !operator) {
    return { ...input, conditionMet: true }
  }

  const inputValue = input[field]

  let conditionMet = false

  switch (operator) {
    case 'equals':
      conditionMet = inputValue === value
      break
    case 'not_equals':
      conditionMet = inputValue !== value
      break
    case 'greater_than':
      conditionMet = inputValue > value
      break
    case 'less_than':
      conditionMet = inputValue < value
      break
    case 'contains':
      conditionMet = String(inputValue).includes(String(value))
      break
    default:
      conditionMet = true
  }

  return { ...input, conditionMet }
}

async function executeAI(node: any, input: any): Promise<any> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = node.data?.prompt || 'Procesa este texto'
    const model = node.data?.model || 'gpt-3.5-turbo'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: JSON.stringify(input) }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    return { ...input, aiResponse, aiProcessed: true }
  } catch (error) {
    console.error('Error in AI node:', error)
    return { ...input, aiProcessed: false, error: error.message }
  }
}

async function executeIntegration(node: any, input: any): Promise<any> {
  const integrationType = node.data?.integrationType || 'generic'

  // Aquí se pueden agregar integraciones específicas
  console.log('Executing integration:', integrationType, node.data)

  return { ...input, integrationExecuted: true }
}

