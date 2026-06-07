'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Sparkles, Send, Settings2, Trash2, Loader2 } from 'lucide-react'

interface Msg {
  id: string
  role: string
  content: string
  createdAt?: string
}

export default function CoachPage() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Msg | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages } = useQuery<Msg[]>({
    queryKey: ['coach-messages'],
    queryFn: () => api.get('/coach/messages').then((r) => r.data),
  })

  const all = [...(messages || []), ...(pending ? [pending] : [])]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [all.length, sending])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setError(null)
    setInput('')
    setPending({ id: 'pending', role: 'user', content: text })
    setSending(true)
    try {
      await api.post('/coach/chat', { message: text })
      await qc.invalidateQueries({ queryKey: ['coach-messages'] })
      setPending(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não consegui enviar agora. Tente de novo.')
      setPending(null)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const clear = async () => {
    if (!confirm('Apagar todo o histórico de conversa com o coach?')) return
    await api.delete('/coach/messages')
    qc.invalidateQueries({ queryKey: ['coach-messages'] })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Coach</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Seu amigo que te cobra com carinho</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clear}
            title="Limpar conversa"
            className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link
            href="/dashboard/coach/admin"
            title="Editar contrato e metas"
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {all.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Comece a conversa. Eu te conheço pelas suas metas.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Ainda não cadastrou seu contrato?{' '}
              <Link href="/dashboard/coach/admin" className="text-primary hover:underline">
                Configure aqui
              </Link>
              .
            </p>
          </div>
        )}

        {all.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-destructive pb-2">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 pt-3 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Fala comigo..."
          disabled={sending}
          autoFocus
        />
        <Button type="submit" size="sm" disabled={sending || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
