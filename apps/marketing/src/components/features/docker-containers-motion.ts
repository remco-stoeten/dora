export const CONTAINERS = [
    { name: 'postgres', tag: '16', port: '5432', phase: 0 },
    { name: 'mysql', tag: '8.4', port: '3306', phase: 1 },
    { name: 'redis', tag: '7', port: '6379', phase: 2 }
]

export const RESTART_MIN_DELAY = 1800
export const RESTART_JITTER = 1500
export const BOOT_MIN_DURATION = 1050
export const BOOT_JITTER = 850
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
