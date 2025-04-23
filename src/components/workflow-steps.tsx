import { Button } from './ui/button'

export interface WorkflowStepsProps {
    ordersMarkedReady: number
    ordersNotMarkedReady: number
    savedViewId: string
    onImportOrders: () => Promise<void>
    onIssueCheck: () => Promise<void>
    onAssignWH: () => Promise<void>
    onMarkReady: () => Promise<void>
    isLoading: boolean
    isIssueChecking: boolean
    isAssigningWH: boolean
    isMarkingReady: boolean
}

export function WorkflowSteps({
    ordersMarkedReady,
    ordersNotMarkedReady,
    savedViewId,
    onImportOrders,
    onIssueCheck,
    onAssignWH,
    onMarkReady,
    isLoading,
    isIssueChecking,
    isAssigningWH,
    isMarkingReady
}: WorkflowStepsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                variant="outline"
                disabled={!savedViewId || isLoading}
                onClick={onImportOrders}
                className="min-w-[120px]"
            >
                {isLoading ? 'Importing...' : 'Import Orders'}
            </Button>

            <Button
                variant="outline"
                disabled={!savedViewId || isIssueChecking}
                onClick={onIssueCheck}
                className="min-w-[120px]"
            >
                {isIssueChecking ? 'Checking...' : 'Issue Check'}
            </Button>

            <Button
                variant="outline"
                disabled={!savedViewId || isAssigningWH}
                onClick={onAssignWH}
                className="min-w-[120px]"
            >
                {isAssigningWH ? 'Assigning...' : 'Assign WH'}
            </Button>

            <Button
                variant="outline"
                disabled={!savedViewId || isMarkingReady}
                onClick={onMarkReady}
                className="min-w-[120px]"
            >
                {isMarkingReady ? 'Marking...' : 'Mark as Ready'}
            </Button>
            {savedViewId && (
                <span className="ml-2 text-sm font-medium text-slate-700">
                    {ordersMarkedReady} orders marked as ready
                </span>

            )}
            {savedViewId && (
                <span className="ml-2 text-sm font-medium text-slate-700">
                    {ordersNotMarkedReady} orders not marked ready
                </span>

            )}
        </div>
    )
}
