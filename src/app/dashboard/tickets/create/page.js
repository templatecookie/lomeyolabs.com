'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  PaperClipIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function CreateTicketPage() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
    category: '',
    product: 'JobPilot',
    purchase_code: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attachments, setAttachments] = useState([])
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('tickets')
        .insert([{
          user_id: user.id,
          subject: formData.subject,
          status: 'open',
          priority: formData.priority,
          category: formData.category,
          product: formData.product,
          purchase_code: formData.purchase_code
        }])
        .select()
        .single()

      if (ticketError) throw ticketError

      // Create initial message
      const { error: messageError } = await supabaseClient
        .from('ticket_messages')
        .insert([{
          ticket_id: ticket.id,
          user_id: user.id,
          message: formData.message,
          is_agent: false
        }])

      if (messageError) throw messageError

      // Handle file uploads
      const fileUploadPromises = attachments.map(async (file) => {
        const { data, error } = await supabaseClient
          .storage
          .from('ticket-attachments')
          .upload(`tickets/${ticket.id}/${file.name}`, file)

        if (error) throw error

        // Create attachment record in ticket_messages
        await supabaseClient
          .from('ticket_messages')
          .insert([{
            ticket_id: ticket.id,
            user_id: user.id,
            message: `Attachment: ${file.name}`,
            is_agent: false
          }])
      })

      await Promise.all(fileUploadPromises)

      router.push('/dashboard/tickets')
    } catch (error) {
      console.error('Error:', error)
      setError(`Failed to create ticket: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/dashboard/tickets"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Support Ticket</h1>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8">
        <div className="flex gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium text-blue-900">Find solution quicker by following steps below</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check our documentation online for the answer to your question.</li>
              <li>• Support query need to be within Envato item support policy.</li>
              <li>• You should maintain only one support ticket at a time.</li>
              <li>• Ticket should provide as much issue details as possible.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Support Hours */}
      <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 mb-8 text-center">
        <p className="text-pink-900">
          We are available from Monday to Friday 9 AM to 5 PM (GMT +6)
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Product*
              </label>
              <select
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="JobPilot">JobPilot</option>
                <option value="RecruitX">RecruitX</option>
              </select>
            </div>

            {/* Purchase Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Code*
              </label>
              <input
                type="text"
                value={formData.purchase_code}
                onChange={(e) => setFormData({ ...formData, purchase_code: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Envato product purchase code"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category*
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {['Installation Support', 'Product Issue', 'Billing Issue', 'Feature Request', 'General Inquiry'].map((cat) => (
                <label
                  key={cat}
                  className={`flex items-center justify-center px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                    formData.category === cat
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={formData.category === cat}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="sr-only"
                    required
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject*
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="What is causing you trouble?"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message*
            </label>
            <ReactQuill
              value={formData.message}
              onChange={(value) => setFormData({ ...formData, message: value })}
              className="block w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add as much information as possible to understand your problem better."
              required
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attachments
            </label>
            
            {/* File List */}
            {attachments.length > 0 && (
              <div className="mb-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PaperClipIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                />
                <PaperClipIcon className="h-4 w-4" />
                Attach Files
              </label>
              <span className="text-sm text-gray-500">
                Supported formats: PNG, JPG, PDF, DOC
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Support Ticket'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  )
} 