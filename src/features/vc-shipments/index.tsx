import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/api'

const UNIS_FACILITIES = [
  { id: '869', name: 'Roanoke, TX' },
  { id: '825', name: 'Cesanek, PA' },
  { id: '889', name: 'Buena Park, CA' },
]

const GOBOLT_FACILITIES = [
  { id: 'yyz5', name: 'Markham, ON (YYZ5)' },
  { id: 'yvr2', name: 'Vancouver, BC (YVR2)' },
]

// SC warehouse ID -> UNIS facility ID (mirrors nexushub's
// SELLER_CLOUD_X_UNIS_FACILITY_MAPPING). A shipment's own ShipFromWarehouseID
// already tells us the facility when it's one of these — no need to ask.
const SC_WAREHOUSE_TO_UNIS_FACILITY: Record<number, string> = {
  178: '889', 181: '889', // UNIS CA (standard, LTL)
  180: '825', 183: '825', // UNIS PA (standard, LTL)
  179: '869', 182: '869', // UNIS TX (standard, LTL)
}

// SC warehouse ID -> GoBolt facility (mirrors nexushub's
// SELLER_CLOUD_X_GOBOLT_FACILITY_MAPPING). Anything in neither map (e.g. a
// Fellowship warehouse) still needs a manual pick, since that routing isn't
// decided yet.
const SC_WAREHOUSE_TO_GOBOLT_FACILITY: Record<number, string> = {
  186: 'yyz5', // GoBolt East
  185: 'yvr2', // GoBolt West
}

interface ReviewLine {
  agendaId: string
  shipmentId: number
  orderId: number
  channelOrderId: string
  sku: string
  plannedQty: number
}

type Provider = 'unis' | 'gobolt'

interface ShipmentGroup {
  agendaId: string
  shipmentId: number
  provider: Provider | null
  facilityId: string
  selected: boolean
}

function facilityName(provider: Provider | null, facilityId: string) {
  const list = provider === 'gobolt' ? GOBOLT_FACILITIES : UNIS_FACILITIES
  return list.find((f) => f.id === facilityId)?.name
}

type Step = 1 | 2 | 3 | 4

function shipmentKey(agendaId: string, shipmentId: number) {
  return `${agendaId}:${shipmentId}`
}

export default function VcShipments() {
  const [step, setStep] = useState<Step>(1)
  const [agendaIdsText, setAgendaIdsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reviewLines, setReviewLines] = useState<ReviewLine[]>([])
  const [shipments, setShipments] = useState<Record<string, ShipmentGroup>>({})
  const [sendResults, setSendResults] = useState<any[]>([])

  // ---- Step 1 -> 2: load orders/SKUs for every agenda ID entered ----
  async function handleLoadOrders() {
    setError(null)
    const agendaIds = agendaIdsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (agendaIds.length === 0) {
      setError('Enter at least one Shipment Agenda ID.')
      return
    }

    setLoading(true)
    try {
      const allLines: ReviewLine[] = []
      const nextShipments: Record<string, ShipmentGroup> = {}
      for (const agendaId of agendaIds) {
        const data = await apiFetch(`/shipments/agenda-shipments?agenda_id=${encodeURIComponent(agendaId)}`)
        for (const shipment of data.Data.Results) {
          const key = shipmentKey(agendaId, shipment.ID)
          const unisFacilityId = SC_WAREHOUSE_TO_UNIS_FACILITY[shipment.ShipFromWarehouseID]
          const goboltFacilityId = SC_WAREHOUSE_TO_GOBOLT_FACILITY[shipment.ShipFromWarehouseID]
          const provider: Provider | null = unisFacilityId ? 'unis' : goboltFacilityId ? 'gobolt' : null
          const facilityId = unisFacilityId ?? goboltFacilityId ?? ''
          nextShipments[key] = {
            agendaId,
            shipmentId: shipment.ID,
            provider,
            facilityId,
            selected: !!facilityId,
          }
          for (const item of shipment.Items) {
            allLines.push({
              agendaId,
              shipmentId: shipment.ID,
              orderId: item.OrderID,
              channelOrderId: item.OrderSourceOrderID,
              sku: item.ProductID,
              plannedQty: item.Qty,
            })
          }
        }
      }
      setReviewLines(allLines)
      setShipments(nextShipments)
      setStep(2)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load shipments for those agenda IDs.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Step 3: toggle whether a UNIS-eligible shipment is included in this send ----
  function toggleShipmentSelected(key: string) {
    setShipments((prev) => ({ ...prev, [key]: { ...prev[key], selected: !prev[key].selected } }))
  }

  // ---- Step 4: send every selected shipment that has a facility set, to whichever
  // provider it resolved to. Each provider checks its own inventory server-side at
  // order-creation time — if it doesn't have enough stock, create_order rejects that
  // line and the error shows up in the result. ----
  async function handleSend() {
    setError(null)
    setLoading(true)
    try {
      const results = []
      for (const [key, s] of Object.entries(shipments)) {
        if (!s.facilityId || !s.selected || !s.provider) continue
        const endpoint =
          s.provider === 'gobolt'
            ? `/shipments/gobolt-shipment?agenda_id=${encodeURIComponent(s.agendaId)}&shipment_id=${s.shipmentId}&gobolt_facility=${s.facilityId}`
            : `/shipments/unis-shipment?agenda_id=${encodeURIComponent(s.agendaId)}&shipment_id=${s.shipmentId}&unis_facility_id=${s.facilityId}`
        const data = await apiFetch(endpoint, { method: 'POST' })
        results.push({
          key,
          agendaId: s.agendaId,
          shipmentId: s.shipmentId,
          provider: s.provider,
          facilityId: s.facilityId,
          ...data,
        })
      }
      setSendResults(results)
      setStep(4)
    } catch (e: any) {
      setError(e.message ?? 'Failed to send shipment(s).')
    } finally {
      setLoading(false)
    }
  }

  function startNewRelease() {
    setStep(1)
    setAgendaIdsText('')
    setReviewLines([])
    setShipments({})
    setSendResults([])
    setError(null)
  }

  const shipmentList = Object.entries(shipments)
  const unisShipments = shipmentList.filter(([, s]) => s.provider === 'unis')
  const goboltShipments = shipmentList.filter(([, s]) => s.provider === 'gobolt')
  const excludedShipments = shipmentList.filter(([, s]) => !s.provider)
  const readyToSendCount = shipmentList.filter(([, s]) => s.facilityId && s.selected).length
  // Each provider gets every line in a shipment, so "total units" is just every planned
  // unit across shipments that are actually going out (i.e. selected and provider-eligible).
  const totalSelectedUnits = reviewLines
    .filter((l) => {
      const s = shipments[shipmentKey(l.agendaId, l.shipmentId)]
      return s?.facilityId && s.selected
    })
    .reduce((sum, l) => sum + l.plannedQty, 0)

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4'>
          <h2 className='text-2xl font-bold tracking-tight'>Send to UNIS / GoBolt — Amazon VC / 1P</h2>
          <p className='text-muted-foreground'>
            Release shipments from Vendor Central agendas into UNIS or GoBolt as 1P orders — one facility per
            shipment, so the same PO split across multiple shipments/facilities creates one order per facility.
            Which provider a shipment goes to is decided by its own warehouse, not a manual choice.
          </p>
        </div>

        {error && (
          <div className='mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {error}
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 of 4 — Enter Shipment Agenda IDs</CardTitle>
              <CardDescription>
                One ID per line, or comma-separated. Every order and SKU tied to these IDs will be loaded.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Textarea
                rows={6}
                placeholder={'10495\n10496\n10497'}
                value={agendaIdsText}
                onChange={(e) => setAgendaIdsText(e.target.value)}
              />
              <Button onClick={handleLoadOrders} disabled={loading}>
                {loading ? 'Loading…' : 'Load Orders →'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 of 4 — Review Orders & SKUs</CardTitle>
              <CardDescription>
                Full SKU-level detail for the agenda IDs loaded, across {shipmentList.length} shipment(s). Nothing is
                sent yet.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agenda ID</TableHead>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Channel Order ID</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className='text-right'>Planned Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewLines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.agendaId}</TableCell>
                      <TableCell>{l.shipmentId}</TableCell>
                      <TableCell>{l.orderId}</TableCell>
                      <TableCell>{l.channelOrderId}</TableCell>
                      <TableCell>{l.sku}</TableCell>
                      <TableCell className='text-right'>{l.plannedQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button onClick={() => setStep(3)}>Continue to Selection →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className='space-y-4'>
            {unisShipments.map(([key, s]) => (
              <Card key={key}>
                <CardHeader>
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      className='mt-1'
                      checked={s.selected}
                      onCheckedChange={() => toggleShipmentSelected(key)}
                    />
                    <div>
                      <CardTitle>
                        Agenda {s.agendaId} — Shipment {s.shipmentId}
                      </CardTitle>
                      <CardDescription>
                        UNIS facility: {facilityName(s.provider, s.facilityId)}. Auto-filled from the shipment's own
                        warehouse. UNIS's own inventory is checked at creation time; the order won't be created if
                        there isn't enough stock there.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {goboltShipments.map(([key, s]) => (
              <Card key={key}>
                <CardHeader>
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      className='mt-1'
                      checked={s.selected}
                      onCheckedChange={() => toggleShipmentSelected(key)}
                    />
                    <div>
                      <CardTitle>
                        Agenda {s.agendaId} — Shipment {s.shipmentId}
                      </CardTitle>
                      <CardDescription>
                        GoBolt facility: {facilityName(s.provider, s.facilityId)}. Auto-filled from the shipment's own
                        warehouse. GoBolt's own inventory is checked at creation time; the order won't be created if
                        there isn't enough stock there. Routed to RetailReady for Amazon processing.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {excludedShipments.length > 0 && (
              <Card className='border-dashed'>
                <CardHeader>
                  <CardTitle className='text-muted-foreground'>Not UNIS/GoBolt-managed — excluded</CardTitle>
                  <CardDescription>
                    These shipments ship from a warehouse that isn't a UNIS or GoBolt facility, so they can't be
                    released here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agenda ID</TableHead>
                        <TableHead>Shipment ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excludedShipments.map(([key, s]) => (
                        <TableRow key={key}>
                          <TableCell>{s.agendaId}</TableCell>
                          <TableCell>{s.shipmentId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button onClick={handleSend} disabled={loading || readyToSendCount === 0}>
                {loading ? 'Sending…' : `Process ${readyToSendCount} Shipment(s) →`}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Note: each provider receives every item in the shipment, not a subset — sending is scoped per shipment.
            </p>
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4 of 4 — Confirm & Send</CardTitle>
              <CardDescription>
                This finalizes the VC shipment payload(s) sent to UNIS/GoBolt via NexusHub. SellerCloud remains
                system of record for all EDI back to Vendor Central.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <span className='text-muted-foreground'>Shipments sent</span>
                <span className='text-right font-medium'>{sendResults.length}</span>
                <span className='text-muted-foreground'>Total units</span>
                <span className='text-right font-medium'>{totalSelectedUnits}</span>
                <span className='text-muted-foreground'>Payload type</span>
                <span className='text-right font-medium'>VC Shipment</span>
              </div>

              <div className='rounded-md border border-green-500/50 bg-green-500/10 p-4'>
                <p className='font-semibold text-green-700 dark:text-green-400'>VC Shipment(s) Sent</p>
                <div className='mt-2 space-y-1 text-sm'>
                  {sendResults.map((r, i) => (
                    <div key={i}>
                      [{r.provider === 'gobolt' ? 'GoBolt' : 'UNIS'}] Agenda {r.agendaId} / Shipment {r.shipmentId} @{' '}
                      {facilityName(r.provider, r.facilityId)}:{' '}
                      {r.results?.map((res: any, j: number) => (
                        <span key={j}>
                          Order {res.order_id} → {res.error ? `failed: ${res.error}` : `queued (${res.message_id})`}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={startNewRelease}>Start New Release</Button>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
