import { apiFetch } from './api'

export interface ProblemOrder {
    order_id: number
    channel_order_id: string
    issue_reason: string
    status_code: number
}

export interface IssueCheckResult {
    problem_orders: ProblemOrder[]
    non_problem_orders: ProblemOrder[]
    total_orders: number
    problem_count: number
    non_problem_count: number
    updated_custom_columns: number
    failed_custom_columns: number
    custom_column_errors: string[]
}

export interface OrderIssuesResponse {
    message: string
    saved_view_id: number
    task_id: string
    status: string
}

export interface OrderIssuesStatus {
    status: string
    result?: IssueCheckResult
    error?: string
    started_at: string
}

export async function checkOrderIssues(savedViewId: number): Promise<OrderIssuesResponse> {
    return apiFetch(`/orders/saved-view/issues?saved_view_id=${savedViewId}`, {
        method: 'POST'
    })
}

export async function getOrderIssuesStatus(taskId: string): Promise<OrderIssuesStatus> {
    return apiFetch(`/orders/saved-view/issues/${taskId}`)
}
