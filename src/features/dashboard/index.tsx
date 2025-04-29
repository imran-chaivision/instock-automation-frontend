import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { LoadingOverlay } from '@/components/loading-overlay.tsx'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { apiFetch } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = "https://instock-automation-backend-94581437211.us-central1.run.app/api/v1"

interface AbortControllerWithInterval extends AbortController {
  interval?: NodeJS.Timeout;
}

interface Shipment {
  ID: number
  ShipmentName: string
  ShipmentStatusName: string
  ShipFromWarehouse: string
  TotalQty: number
  NoOfCartons: number
  Items: {
    ProductID: string
    ProductName: string
    Qty: number
  }[]
}

interface ShipmentResponse {
  Data: {
    Results: Shipment[]
    TotalResults: number
  }
  Kind: number
  Success: boolean
  DebugInfo: any
}

interface ShipmentDocumentResponse {
  message: string
  task_id: string
}

export default function Dashboard() {
  const { showToast, ToastContainer } = useToast()
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortControllerWithInterval | null>(null)
  const [isAnyLoading, setIsAnyLoading] = useState(false)
  const [agendaId, setAgendaId] = useState<string>('')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('')
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [rawCookies, setRawCookies] = useState<string>('')
  const [isFetchingShipments, setIsFetchingShipments] = useState(false)
  const [isProcessingDocuments, setIsProcessingDocuments] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [driveLink, setDriveLink] = useState<string | null>(null)
  // Cleanup function to cancel any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    setIsAnyLoading(isFetchingShipments)
  }, [isFetchingShipments])

  const fetchShipments = async () => {
    if (!agendaId) {
      setError('Please enter an Agenda ID')
      return
    }

    setIsFetchingShipments(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/shipments/agenda-shipments?agenda_id=${agendaId}`,
        { signal: abortControllerRef.current?.signal }
      ) as ShipmentResponse

      if (response.Success && response.Data.Results) {
        setShipments(response.Data.Results)
      } else {
        setError('Failed to fetch shipments')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments')
    } finally {
      setIsFetchingShipments(false)
    }
  }

  const handleCreateShipmentDocuments = async () => {
    if (!agendaId || !selectedShipmentId || !csrfToken || !rawCookies) {
      setError('Please fill in all required fields')
      return
    }

    setIsProcessingDocuments(true)
    setDocumentError(null)

    try {
      const response = await apiFetch(
        `/shipments/shipment-documents?agenda_id=${agendaId}&shipment_id=${selectedShipmentId}&csrftoken=${csrfToken}&raw_cookies=${encodeURIComponent(rawCookies)}`,
        {
          method: 'POST',
          signal: abortControllerRef.current?.signal
        }
      ) as ShipmentDocumentResponse

      // Start polling for status
      const pollStatus = async () => {
        setLogs([])
        setDriveLink(null)
        try {
          const statusResponse = await fetch(
            `${API_BASE_URL}/shipments/shipment-documents/${response.task_id}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              signal: abortControllerRef.current?.signal
            }
          )

          const contentType = statusResponse.headers.get('content-type')

          if (statusResponse.status === 200 && contentType?.includes('application/zip')) {
            // Get the filename from the Content-Disposition header
            const contentDisposition = statusResponse.headers.get('Content-Disposition')
            const filename = contentDisposition
              ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
              : `shipment_documents_${selectedShipmentId}.zip`

            // Get logs from the custom header
            const logsHeader = statusResponse.headers.get('X-Logs')
            if (logsHeader) {
              try {
                const logs = JSON.parse(logsHeader)
                // You can display logs in a modal or console
                setLogs(logs)
              } catch (error) {
                console.error('Error parsing logs:', error)
              }
            }

            const driveLink = statusResponse.headers.get('X-Drive-Link')
            if (driveLink) {
              setDriveLink(driveLink)
            }

            // Create a blob from the response
            const blob = await statusResponse.blob()

            // Create a temporary link element and trigger the download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            showToast('Success', 'Shipment documents downloaded successfully', 'success')
            setIsProcessingDocuments(false)
          } else if (statusResponse.status === 202) {
            // Still processing, poll again after 2 seconds
            setTimeout(pollStatus, 2000)
          } else if (statusResponse.status === 404) {
            const errorData = await statusResponse.json()
            setDocumentError(errorData.detail || 'Task not found or expired')
            showToast('Error', errorData.detail || 'Task not found or expired', 'error')
            setIsProcessingDocuments(false)
          } else if (statusResponse.status === 500) {
            const errorData = await statusResponse.json()
            setDocumentError(errorData.detail || 'Failed to process shipment documents')
            showToast('Error', errorData.detail || 'Failed to process shipment documents', 'error')
            setIsProcessingDocuments(false)
          } else {
            // Handle unexpected response
            setDocumentError('Unexpected response from server')
            showToast('Error', 'Unexpected response from server', 'error')
            setIsProcessingDocuments(false)
          }
        } catch (err) {
          setDocumentError(err instanceof Error ? err.message : 'Failed to check document status')
          showToast('Error', err instanceof Error ? err.message : 'Failed to check document status', 'error')
          setIsProcessingDocuments(false)
        }
      }

      pollStatus()
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : 'Failed to start document processing')
      showToast('Error', err instanceof Error ? err.message : 'Failed to start document processing', 'error')
      setIsProcessingDocuments(false)
    }
  }

  return (
    <>
      <Header>
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <LoadingOverlay isVisible={isAnyLoading} />
        <div className='space-y-8'>

          {/* Shipment Documents Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Shipment Documents</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Enter Agenda ID"
                  value={agendaId}
                  onChange={(e) => setAgendaId(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <Button
                  variant="outline"
                  onClick={fetchShipments}
                  disabled={isFetchingShipments}
                >
                  {isFetchingShipments ? 'Fetching...' : 'Fetch Shipments'}
                </Button>
              </div>

              {shipments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedShipmentId}
                      onChange={(e) => setSelectedShipmentId(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="">Select a Shipment</option>
                      {shipments.map((shipment) => (
                        <option key={shipment.ID} value={shipment.ID}>
                          {shipment.ShipmentName} - {shipment.ShipFromWarehouse} ({shipment.TotalQty} units)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Enter CSRF Token"
                      value={csrfToken}
                      onChange={(e) => setCsrfToken(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Enter Raw Cookies"
                      value={rawCookies}
                      onChange={(e) => setRawCookies(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCreateShipmentDocuments}
                      disabled={isProcessingDocuments || !selectedShipmentId || !csrfToken || !rawCookies}
                    >
                      {isProcessingDocuments ? 'Processing...' : 'Download Documents'}
                    </Button>
                  </div>
                </div>
              )}

              {documentError && (
                <div className="text-sm text-red-500">
                  {documentError}
                </div>
              )}
              {logs.length > 0 && (
                <div className="text-sm text-red-500">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
              {driveLink && (
                <div className="text-sm text-green-500">
                  <a href={driveLink} target="_blank" rel="noopener noreferrer">
                    View Google Drive Link
                  </a>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className='mt-4 text-sm text-red-500 whitespace-pre-line'>
              {error}
            </div>
          )}
        </div>
      </Main>
      <ToastContainer />
    </>
  )
}
