import Head from 'next/head'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'budgetState-v1'

const getInitialData = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultState = {
  income: 2200,
  checkingBalance: 0,
  recurring: {
    'Health Insurance': 123.75,
    'Slack': 18.26,
    'Apple Digital': 42.98,
    'HackChinese': 12.00,
    'Squarespace': 36.00,
    'LinkedIn': 59.99,
    'ChatGPT': 200.00,
    'Gas': 100.00,
    'Lattes': 420.00,
    'UCI Patent Debt': 500.00,
    'Spotify': 12.99
  },
  pending: {
    'Taxes': 167.49,
    'Tax Accountant': 375,
    'Guitar Completion': 1000
  },
  creditCards: {
    'Chase': { balance: 12.00, due: '2025-08-24' },
    'SchoolsFirstFCU': { balance: 0.00, due: '2025-08-27' }
  },
  extras: []
}

export default function Home() {
  const [data, setData] = useState(defaultState)

  useEffect(() => {
    const stored = getInitialData()
    if (stored) setData(stored)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  const [newRecurringName, setNewRecurringName] = useState('')
  const [newRecurringAmount, setNewRecurringAmount] = useState('')
  const [newPendingName, setNewPendingName] = useState('')
  const [newPendingAmount, setNewPendingAmount] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const handleUpdateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const handleCardUpdate = (name: string, value: number) => {
    const updated = {
      ...data.creditCards,
      [name]: { ...data.creditCards[name], balance: value }
    }
    setData(prev => ({ ...prev, creditCards: updated }))
  }

  const handleAddRecurring = () => {
    if (!newRecurringName || isNaN(parseFloat(newRecurringAmount))) return
    const updated = { ...data.recurring, [newRecurringName]: parseFloat(newRecurringAmount) }
    setData(prev => ({ ...prev, recurring: updated }))
    setNewRecurringName('')
    setNewRecurringAmount('')
  }

  const handleRemoveRecurring = (name: string) => {
    const { [name]: _, ...rest } = data.recurring
    setData(prev => ({ ...prev, recurring: rest }))
  }

  const handleAddPending = () => {
    if (!newPendingName || isNaN(parseFloat(newPendingAmount))) return
    const updated = { ...data.pending, [newPendingName]: parseFloat(newPendingAmount) }
    setData(prev => ({ ...prev, pending: updated }))
    setNewPendingName('')
    setNewPendingAmount('')
  }

  const handleRemovePending = (name: string) => {
    const { [name]: _, ...rest } = data.pending
    setData(prev => ({ ...prev, pending: rest }))
  }

  const handleAddExtra = () => {
    if (!description || isNaN(parseFloat(amount))) return
    const newItem = { date: today, description, amount: parseFloat(amount) }
    setData(prev => ({ ...prev, extras: [...prev.extras, newItem] }))
    setDescription('')
    setAmount('')
  }

  const totalRecurring = Object.values(data.recurring).reduce((a, b) => a + b, 0)
  const totalPending = Object.values(data.pending).reduce((a, b) => a + b, 0)
  const totalExtras = data.extras.reduce((a, b) => a + b.amount, 0)
  const discretionary = data.income - totalRecurring - totalExtras

  const saveChanges = () => {
    const rows = [
      ['Date', 'Description', 'Amount'],
      ...Object.entries(data.recurring).map(([desc, amt]) => ['Monthly', desc, amt]),
      ...Object.entries(data.pending).map(([desc, amt]) => ['Pending', desc, amt]),
      ...Object.entries(data.creditCards).map(([name, { balance, due }]) => ['CreditCard', `${name} (due ${due})`, balance]),
      ['Bank', 'Checking Balance', data.checkingBalance],
      ...data.extras.map(e => [e.date, e.description, e.amount])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget_${today.slice(0, 7)}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Head><title>Budget Dashboard</title></Head>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">💸 Budget Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Income</h2>
          <p className="mb-2">Current: ${data.income.toFixed(2)}</p>
          <input
            type="number"
            className="border p-2 w-full"
            value={data.income}
            onChange={e => handleUpdateField('income', parseFloat(e.target.value))}
          />
        </div>

        {/* Checking */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Checking Balance</h2>
          <p className="mb-2">Current: ${data.checkingBalance.toFixed(2)}</p>
          <input
            type="number"
            className="border p-2 w-full"
            value={data.checkingBalance}
            onChange={e => handleUpdateField('checkingBalance', parseFloat(e.target.value))}
          />
        </div>

        {/* Credit Cards */}
        <div className="bg-white p-4 rounded-xl shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">Credit Cards</h2>
          {Object.entries(data.creditCards).map(([name, { balance, due }]) => (
            <div key={name} className="mb-4">
              <p><strong>{name}</strong> — Due: {due}</p>
              <p>Current: ${balance.toFixed(2)}</p>
              <input
                type="number"
                className="border p-2 w-full"
                value={balance}
                onChange={(e) => handleCardUpdate(name, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        {/* Recurring Costs */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Recurring Costs</h2>
          <ul className="text-sm space-y-1">
            {Object.entries(data.recurring).map(([k, v]) => (
              <li key={k} className="flex justify-between items-center">
                <span>{k}: ${v.toFixed(2)}</span>
                <button onClick={() => handleRemoveRecurring(k)} className="text-red-500 ml-2">✖</button>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2">
            <input className="border p-2 w-full" placeholder="New Name" value={newRecurringName} onChange={e => setNewRecurringName(e.target.value)} />
            <input className="border p-2 w-full" placeholder="Amount" type="number" value={newRecurringAmount} onChange={e => setNewRecurringAmount(e.target.value)} />
            <button onClick={handleAddRecurring} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Add Recurring</button>
          </div>
        </div>

        {/* Pending Costs */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Pending Costs</h2>
          <ul className="text-sm space-y-1">
            {Object.entries(data.pending).map(([k, v]) => (
              <li key={k} className="flex justify-between items-center">
                <span>{k}: ${v.toFixed(2)}</span>
                <button onClick={() => handleRemovePending(k)} className="text-red-500 ml-2">✖</button>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2">
            <input className="border p-2 w-full" placeholder="New Pending Name" value={newPendingName} onChange={e => setNewPendingName(e.target.value)} />
            <input className="border p-2 w-full" placeholder="Amount" type="number" value={newPendingAmount} onChange={e => setNewPendingAmount(e.target.value)} />
            <button onClick={handleAddPending} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Add Pending</button>
          </div>
        </div>

        {/* Discretionary Spending */}
        <div className="bg-white p-4 rounded-xl shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">Add Discretionary Spending</h2>
          <div className="flex space-x-2 mb-2">
            <input placeholder="Description" className="border p-2 flex-1" value={description} onChange={e => setDescription(e.target.value)} />
            <input placeholder="Amount" type="number" className="border p-2 w-32" value={amount} onChange={e => setAmount(e.target.value)} />
            <button onClick={handleAddExtra} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
          </div>
          <ul className="text-sm">
            {data.extras.map((e, i) => (
              <li key={i}>{e.date} - {e.description}: ${e.amount.toFixed(2)}</li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className="bg-green-100 p-4 rounded-xl shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">📊 Summary</h2>
          <p><strong>Income:</strong> ${data.income.toFixed(2)}</p>
          <p><strong>Recurring:</strong> ${totalRecurring.toFixed(2)}</p>
          <p><strong>Pending:</strong> ${totalPending.toFixed(2)}</p>
          <p><strong>Discretionary Spent:</strong> ${totalExtras.toFixed(2)}</p>
          <p><strong>Remaining:</strong> ${discretionary.toFixed(2)}</p>
          <button onClick={saveChanges} className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">💾 Save CSV</button>
        </div>
      </div>
    </div>
  )
}
