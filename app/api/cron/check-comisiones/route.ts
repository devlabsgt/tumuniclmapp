import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webPush from 'web-push'

webPush.setVapidDetails(
  `mailto:${process.env.NEXT_PUBLIC_VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const report = { inicio: 0, faltas: 0 }

    const timeWindowStart = new Date(now.getTime() + 15 * 60000) 
    const timeWindowEnd = new Date(now.getTime() + 25 * 60000)

    const { data: upcomingCommissions } = await supabase
      .from('comisiones')
      .select(`
        id, 
        titulo, 
        fecha_hora,
        comision_asistentes ( asistente_id )
      `)
      .gt('fecha_hora', now.toISOString()) 
      .lte('fecha_hora', timeWindowEnd.toISOString())
      .eq('notificacion_inicio_enviada', false)
      .eq('aprobado', true)

    if (upcomingCommissions && upcomingCommissions.length > 0) {
      for (const comision of upcomingCommissions) {
        // @ts-ignore
        const userIds = comision.comision_asistentes.map((a: any) => a.asistente_id)
        
        if (userIds.length > 0) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .in('user_id', userIds)

          if (subs && subs.length > 0) {
            const payload = JSON.stringify({
              title: '⏰ Recordatorio de Comisión',
              body: `La comisión "${comision.titulo}" está por comenzar.`,
              url: `/protected/comisiones?id=${comision.id}`,
              icon: '/icon-192x192.png'
            })

            await Promise.all(subs.map(s => 
              webPush.sendNotification(s.subscription as any, payload).catch(e => console.error(e))
            ))
            report.inicio += subs.length
          }
        }
        
        await supabase
          .from('comisiones')
          .update({ notificacion_inicio_enviada: true })
          .eq('id', comision.id)
      }
    }

    const timePastStart = new Date(now.getTime() - 120 * 60000)
    const timePastEnd = new Date(now.getTime())

    const { data: pastCommissions } = await supabase
      .from('comisiones')
      .select(`
        id, 
        titulo, 
        fecha_hora,
        comision_asistentes ( asistente_id )
      `)
      .gt('fecha_hora', timePastStart.toISOString())
      .lt('fecha_hora', timePastEnd.toISOString())
      .eq('notificacion_falta_enviada', false)
      .eq('aprobado', true)

    if (pastCommissions && pastCommissions.length > 0) {
      for (const comision of pastCommissions) {
        const { data: attendance } = await supabase
          .from('registros_comision')
          .select('user_id')
          .eq('comision_id', comision.id)

        const markedUserIds = new Set(attendance?.map(r => r.user_id) || [])
        
        // @ts-ignore
        const allAssistants: string[] = comision.comision_asistentes.map((a: any) => a.asistente_id)
        
        const missingUserIds = allAssistants.filter(id => !markedUserIds.has(id))

        if (missingUserIds.length > 0) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .in('user_id', missingUserIds)

          if (subs && subs.length > 0) {
            const payload = JSON.stringify({
              title: '⚠️ Asistencia Pendiente',
              body: `La comisión "${comision.titulo}" ya inició. Por favor marca tu asistencia.`,
              url: `/protected/asistencias`,
              icon: '/icon-192x192.png'
            })

            await Promise.all(subs.map(s => 
              webPush.sendNotification(s.subscription as any, payload).catch(e => console.error(e))
            ))
            report.faltas += subs.length
          }
        }

        await supabase
          .from('comisiones')
          .update({ notificacion_falta_enviada: true })
          .eq('id', comision.id)
      }
    }

    return NextResponse.json({ success: true, processed: report }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}