export const CONTAINERS = [
    { name: 'postgres', tag: '16', port: '5432', phase: 0 },
    { name: 'mysql', tag: '8.4', port: '3306', phase: 1 },
    { name: 'redis', tag: '7', port: '6379', phase: 2 }
]

export const EQ_PATTERNS = [
    [
        { x: 4, values: '5;15;7;18;9;12;5', dur: '1.04s', begin: '-0.12s' },
        { x: 11, values: '8;11;18;6;15;9;8', dur: '1.28s', begin: '-0.51s' },
        { x: 18, values: '6;17;10;13;5;16;6', dur: '0.92s', begin: '-0.33s' },
        { x: 25, values: '7;13;6;17;11;15;7', dur: '1.17s', begin: '-0.74s' },
        { x: 32, values: '9;12;16;8;14;10;9', dur: '1.41s', begin: '-0.27s' }
    ],
    [
        { x: 4, values: '7;12;17;8;14;6;7', dur: '1.31s', begin: '-0.66s' },
        { x: 11, values: '5;18;9;12;16;7;5', dur: '0.98s', begin: '-0.18s' },
        { x: 18, values: '8;14;5;16;10;13;8', dur: '1.22s', begin: '-0.83s' },
        { x: 25, values: '6;11;15;7;18;9;6', dur: '1.09s', begin: '-0.42s' },
        { x: 32, values: '10;15;8;13;6;17;10', dur: '1.52s', begin: '-0.24s' }
    ],
    [
        { x: 4, values: '6;10;16;7;12;18;6', dur: '1.46s', begin: '-0.39s' },
        { x: 11, values: '9;17;6;14;8;12;9', dur: '1.13s', begin: '-0.71s' },
        { x: 18, values: '5;13;9;18;7;15;5', dur: '1.02s', begin: '-0.22s' },
        { x: 25, values: '8;12;17;10;14;6;8', dur: '1.37s', begin: '-0.93s' },
        { x: 32, values: '7;16;11;5;18;9;7', dur: '1.19s', begin: '-0.47s' }
    ]
]

export const RESTART_MIN_DELAY = 1800
export const RESTART_JITTER = 1500
export const BOOT_MIN_DURATION = 1050
export const BOOT_JITTER = 850
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
