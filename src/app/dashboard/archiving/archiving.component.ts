import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
    selector: 'app-archiving',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './archiving.component.html',
    styleUrl: './archiving.component.css',
})
export class ArchivingComponent {
    // Sample archived data
    archives = [
        {
            id: 1,
            name: 'User Activity Logs - Q4 2024',
            size: '2.3 GB',
            date: new Date('2024-12-31'),
            type: 'logs',
            status: 'completed',
        },
        {
            id: 2,
            name: 'System Backups - December 2024',
            size: '15.7 GB',
            date: new Date('2024-12-30'),
            type: 'backup',
            status: 'completed',
        },
        {
            id: 3,
            name: 'Transaction Records - November 2024',
            size: '856 MB',
            date: new Date('2024-11-30'),
            type: 'data',
            status: 'completed',
        },
        {
            id: 4,
            name: 'Email Archives - October 2024',
            size: '4.2 GB',
            date: new Date('2024-10-31'),
            type: 'email',
            status: 'processing',
        },
    ]

    selectedArchives: number[] = []

    stats = {
        totalArchives: this.archives.length,
        totalSize: '23.1 GB',
        processingCount: this.archives.filter((a) => a.status === 'processing').length,
        completedCount: this.archives.filter((a) => a.status === 'completed').length,
    }

    toggleArchiveSelection(archiveId: number): void {
        const index = this.selectedArchives.indexOf(archiveId)
        if (index > -1) {
            this.selectedArchives.splice(index, 1)
        } else {
            this.selectedArchives.push(archiveId)
        }
    }

    isSelected(archiveId: number): boolean {
        return this.selectedArchives.includes(archiveId)
    }

    downloadArchive(archive: { id: number; name: string; size: string; date: Date; type: string; status: string }): void {
        console.log('Downloading archive:', archive.name)
        // Implement download logic here
    }

    deleteSelectedArchives(): void {
        if (this.selectedArchives.length === 0) {
            return
        }

        console.log('Deleting archives:', this.selectedArchives)
        this.archives = this.archives.filter((archive) => !this.selectedArchives.includes(archive.id))
        this.selectedArchives = []
        this.updateStats()
    }

    private updateStats(): void {
        this.stats = {
            totalArchives: this.archives.length,
            totalSize: '23.1 GB', // This would be calculated dynamically in a real app
            processingCount: this.archives.filter((a) => a.status === 'processing').length,
            completedCount: this.archives.filter((a) => a.status === 'completed').length,
        }
    }

    getTypeIcon(type: string): string {
        switch (type) {
            case 'logs':
                return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            case 'backup':
                return 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
            case 'data':
                return 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
            case 'email':
                return 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            default:
                return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'processing':
                return 'bg-yellow-100 text-yellow-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }
}
