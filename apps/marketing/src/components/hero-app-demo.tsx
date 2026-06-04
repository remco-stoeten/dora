import { CornerTick } from '@/components/corner-tick'
import { DemoMain } from '@/components/hero-app-demo-main'
import { DemoSidebar } from '@/components/hero-app-demo-sidebar'

export function AppDemo() {
    return (
        <div className="hero-app-demo" aria-hidden="true">
            {/* Top corners — the bottom pair is supplied by the hero frame's own
                bottom corner ticks, since the demo sits flush to it. */}
            <CornerTick className="-left-px -top-px -translate-x-1/2 -translate-y-1/2" />
            <CornerTick className="-right-px -top-px translate-x-1/2 -translate-y-1/2" />
            <div className="hero-app-demo__viewport">
                <div className="hero-app-demo__camera">
                    <div className="hero-app-demo__window">
                        <DemoSidebar />
                        <DemoMain />
                    </div>
                </div>
            </div>
        </div>
    )
}
