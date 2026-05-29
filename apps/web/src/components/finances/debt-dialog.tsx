'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DebtDialog({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ description: '', totalAmount: '', paidAmount: '0', dueDate: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/debts', {
        description: form.description,
        totalAmount: parseFloat(form.totalAmount),
        paidAmount: parseFloat(form.paidAmount || '0'),
        dueDate: form.dueDate || undefined,
      })
      setForm({ description: '', totalAmount: '', paidAmount: '0', dueDate: '' })
      onSuccess()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex: Financiamento, Cartão..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total (R$)</Label>
              <Input type="number" step="0.01" value={form.totalAmount} onChange={(e) => set('totalAmount', e.target.value)} placeholder="0,00" required min="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Já pago (R$)</Label>
              <Input type="number" step="0.01" value={form.paidAmount} onChange={(e) => set('paidAmount', e.target.value)} placeholder="0,00" min="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Vencimento (opcional)</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
