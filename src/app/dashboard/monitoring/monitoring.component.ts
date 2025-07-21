import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-monitoring',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './monitoring.component.html',
    styleUrl: './monitoring.component.css',
})
export class MonitoringComponent {
    // Sample monitoring data
    systemStatus = {
        cpu: { usage: 75, status: 'normal' },
        memory: { usage: 60, status: 'normal' },
        disk: { usage: 45, status: 'good' },
        network: { usage: 30, status: 'excellent' },
    }

    alerts = [
        { id: 1, type: 'warning', message: 'High CPU usage detected', timestamp: new Date() },
        { id: 2, type: 'info', message: 'System backup completed successfully', timestamp: new Date(Date.now() - 3600000) },
        { id: 3, type: 'error', message: 'Database connection timeout', timestamp: new Date(Date.now() - 7200000) },
    ]

    getStatusColor(status: string): string {
        switch (status) {
            case 'excellent':
                return 'text-green-600'
            case 'good':
                return 'text-blue-600'
            case 'normal':
                return 'text-yellow-600'
            case 'warning':
                return 'text-orange-600'
            case 'critical':
                return 'text-red-600'
            default:
                return 'text-gray-600'
        }
    }

    getAlertColor(type: string): string {
        switch (type) {
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800'
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800'
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800'
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800'
        }
    }
}
