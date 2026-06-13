import { ResourcesPageShell } from '@/components/resources-page-shell'

const PRIVACY_TOPICS = [
    'Explain what data Dora stores locally.',
    'Explain whether telemetry is collected.',
    'Explain how users can request privacy support.'
] as const

export default function PrivacyView() {
    return (
        <ResourcesPageShell
            eyebrow="Privacy"
            title="Dora privacy"
            lead="Replace this placeholder with the production privacy policy before launch."
        >
            <ul className="max-w-2xl space-y-3">
                {PRIVACY_TOPICS.map(function (topic) {
                    return (
                        <li
                            key={topic}
                            className="relative pl-4 text-[15px] leading-relaxed text-muted-foreground before:absolute before:left-0 before:top-[0.62em] before:h-1 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[#3a3138]"
                        >
                            {topic}
                        </li>
                    )
                })}
            </ul>
        </ResourcesPageShell>
    )
}
